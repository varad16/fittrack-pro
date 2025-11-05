// ============================================
// 📂 FILE PATH: app/api/ai/workout-plan/route.ts
// ============================================
// PURPOSE: Generate AI workout plans
// ============================================

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateWorkoutPlan } from '@/lib/openai'
import { z } from 'zod'

const workoutPlanSchema = z.object({
  goal: z.enum(['muscle_gain', 'weight_loss', 'strength', 'endurance', 'general_fitness']),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  equipment: z.enum(['gym', 'home', 'bodyweight']),
  duration: z.number().min(15).max(120),
  workoutType: z.enum(['strength', 'cardio', 'hiit', 'flexibility', 'full_body']).optional(),
  daysPerWeek: z.number().min(1).max(7).optional(),
  focusAreas: z.array(z.string()).optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await req.json()
    const data = workoutPlanSchema.parse(body)

    console.log('Generating workout plan with AI...')
    console.log('Parameters:', data)

    // Generate workout plan using OpenAI
    const workoutPlan = await generateWorkoutPlan({
      goal: data.goal,
      fitnessLevel: data.fitnessLevel,
      equipment: data.equipment,
      duration: data.duration,
      workoutType: data.workoutType || 'full_body',
      daysPerWeek: data.daysPerWeek || 3,
      focusAreas: data.focusAreas || [],
    })

    console.log('Workout plan generated successfully')

    return NextResponse.json({
      workoutPlan,
      message: 'Workout plan generated successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    
    console.error('Error generating workout plan:', error)
    return NextResponse.json(
      { error: 'Failed to generate workout plan' },
      { status: 500 }
    )
  }
}