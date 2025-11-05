import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const activitySchema = z.object({
  activityType: z.enum(['running', 'cycling', 'walking', 'hiking']),
  name: z.string().optional().nullable(),
  startTime: z.string(),
  endTime: z.string().optional().nullable(),
  distance: z.number().optional().nullable(),
  duration: z.number().optional().nullable(), // in seconds
  avgPace: z.number().optional().nullable(),
  elevationGain: z.number().optional().nullable(),
  calories: z.number().optional().nullable(),
  routeData: z.any().optional().nullable(), // GeoJSON
  isPublic: z.boolean().optional(),
})

// GET - Get user's activities
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    const activities = await prisma.activity.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: { startTime: 'desc' },
      take: limit,
    })

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

// POST - Create activity
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = activitySchema.parse(body)

    const activity = await prisma.activity.create({
      data: {
        userId: session.user.id,
        activityType: data.activityType,
        name: data.name,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
        distance: data.distance,
        duration: data.duration,
        avgPace: data.avgPace,
        elevationGain: data.elevationGain,
        calories: data.calories,
        routeData: data.routeData,
        isPublic: data.isPublic ?? false,
      },
    })

    return NextResponse.json({ activity }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    
    console.error('Error creating activity:', error)
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    )
  }
}