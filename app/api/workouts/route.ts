import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const workoutSchema = z.object({
  name: z.string().min(1, 'Workout name is required'),
  date: z.string().optional(),
  notes: z.string().optional(),
})

// GET - Get user's workouts
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const workouts = await prisma.workout.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        exercises: {
          orderBy: { orderIndex: 'asc' }
        },
      },
      orderBy: { date: 'desc' },
      take: limit,
    })

    return NextResponse.json({ workouts })
  } catch (error) {
    console.error('Error fetching workouts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workouts' },
      { status: 500 }
    )
  }
}

// POST - Create a new workout
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, date, notes } = workoutSchema.parse(body)

    const workoutDate = date ? new Date(date) : new Date()

    const workout = await prisma.workout.create({
      data: {
        userId: session.user.id,
        name,
        date: workoutDate,
        notes: notes || null,
        duration: null,
        caloriesBurned: null,
      },
      include: {
        exercises: true,
      },
    })

    return NextResponse.json({ workout }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    
    console.error('Error creating workout:', error)
    return NextResponse.json(
      { error: 'Failed to create workout' },
      { status: 500 }
    )
  }
}