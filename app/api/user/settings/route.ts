import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const settingsSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  height: z.number().positive().optional().nullable(),
  currentWeight: z.number().positive().optional().nullable(),
  goalWeight: z.number().positive().optional().nullable(),
  activityLevel: z.string().optional().nullable(),
  calorieGoal: z.number().int().positive().optional().nullable(),
  proteinGoal: z.number().int().positive().optional().nullable(),
  carbGoal: z.number().int().positive().optional().nullable(),
  fatGoal: z.number().int().positive().optional().nullable(),
  dietaryPreference: z.string().optional().nullable(),
  measurementSystem: z.enum(['metric', 'imperial']).optional(),
})

// GET - Get user settings
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        dateOfBirth: true,
        gender: true,
        height: true,
        currentWeight: true,
        goalWeight: true,
        activityLevel: true,
        calorieGoal: true,
        proteinGoal: true,
        carbGoal: true,
        fatGoal: true,
        dietaryPreference: true,
        measurementSystem: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching user settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT - Update user settings
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = settingsSchema.parse(body)

    // Update user data
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.dateOfBirth !== undefined && { 
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null 
        }),
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.height !== undefined && { height: data.height }),
        ...(data.currentWeight !== undefined && { currentWeight: data.currentWeight }),
        ...(data.goalWeight !== undefined && { goalWeight: data.goalWeight }),
        ...(data.activityLevel !== undefined && { activityLevel: data.activityLevel }),
        ...(data.calorieGoal !== undefined && { calorieGoal: data.calorieGoal }),
        ...(data.proteinGoal !== undefined && { proteinGoal: data.proteinGoal }),
        ...(data.carbGoal !== undefined && { carbGoal: data.carbGoal }),
        ...(data.fatGoal !== undefined && { fatGoal: data.fatGoal }),
        ...(data.dietaryPreference !== undefined && { dietaryPreference: data.dietaryPreference }),
        ...(data.measurementSystem && { measurementSystem: data.measurementSystem }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        dateOfBirth: true,
        gender: true,
        height: true,
        currentWeight: true,
        goalWeight: true,
        activityLevel: true,
        calorieGoal: true,
        proteinGoal: true,
        carbGoal: true,
        fatGoal: true,
        dietaryPreference: true,
        measurementSystem: true,
      },
    })

    return NextResponse.json({ user, message: 'Settings updated successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error('Error updating user settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
