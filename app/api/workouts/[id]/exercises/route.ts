import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const exerciseSchema = z.object({
  exerciseName: z.string().min(1, 'Exercise name is required'),
  exerciseType: z.enum(['strength', 'cardio', 'flexibility']),
  sets: z.number().optional().nullable(),
  reps: z.number().optional().nullable(),
  weight: z.number().optional().nullable(),
  duration: z.number().optional().nullable(),
  distance: z.number().optional().nullable(),
  restTime: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
})

// POST - Add exercise to workout
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const workoutId = params.id

    // Verify workout belongs to user
    const workout = await prisma.workout.findFirst({
      where: {
        id: workoutId,
        userId: session.user.id,
      },
      include: {
        exercises: true,
      },
    })

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 })
    }

    const body = await req.json()
    const exerciseData = exerciseSchema.parse(body)

    // Get next order index
    const orderIndex = workout.exercises.length

    // Create exercise
    const exercise = await prisma.exercise.create({
      data: {
        workout: {
          connect: { id: workoutId }
        },
        exerciseName: exerciseData.exerciseName,
        exerciseType: exerciseData.exerciseType,
        sets: exerciseData.sets,
        reps: exerciseData.reps,
        weight: exerciseData.weight,
        duration: exerciseData.duration,
        distance: exerciseData.distance,
        restTime: exerciseData.restTime,
        notes: exerciseData.notes,
        orderIndex,
      },
    })

    const updatedWorkout = await prisma.workout.findUnique({
      where: { id: workoutId },
      include: {
        exercises: {
          orderBy: { orderIndex: 'asc' }
        },
      },
    })

    return NextResponse.json({ workout: updatedWorkout, exercise }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    
    console.error('Error adding exercise:', error)
    return NextResponse.json(
      { error: 'Failed to add exercise' },
      { status: 500 }
    )
  }
}

// DELETE - Remove exercise from workout
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const exerciseId = searchParams.get('exerciseId')

    if (!exerciseId) {
      return NextResponse.json(
        { error: 'exerciseId is required' },
        { status: 400 }
      )
    }

    // Get exercise
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      include: {
        workout: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (exercise.workout.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete exercise
    await prisma.exercise.delete({
      where: { id: exerciseId },
    })

    const params = await context.params
    const updatedWorkout = await prisma.workout.findUnique({
      where: { id: params.id },
      include: {
        exercises: {
          orderBy: { orderIndex: 'asc' }
        },
      },
    })

    return NextResponse.json({ workout: updatedWorkout })
  } catch (error) {
    console.error('Error deleting exercise:', error)
    return NextResponse.json(
      { error: 'Failed to delete exercise' },
      { status: 500 }
    )
  }
}