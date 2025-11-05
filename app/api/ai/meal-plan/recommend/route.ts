import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateMealPlan } from '@/lib/openai'
import { z } from 'zod'

const mealPlanSchema = z.object({
  daysCount: z.number().min(1).max(14).optional().default(7),
  calorieGoal: z.number().positive().optional(),
  proteinGoal: z.number().positive().optional(),
  carbGoal: z.number().positive().optional(),
  fatGoal: z.number().positive().optional(),
  dietaryPreference: z.string().optional(),
  allergies: z.array(z.string()).optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user with their goals
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        calorieGoal: true,
        proteinGoal: true,
        carbGoal: true,
        fatGoal: true,
        dietaryPreference: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await req.json()
    const data = mealPlanSchema.parse(body)

    // Use user's goals or provided goals
    const calorieGoal = data.calorieGoal || user.calorieGoal || 2000
    const proteinGoal = data.proteinGoal || user.proteinGoal || 150
    const carbGoal = data.carbGoal || user.carbGoal || 200
    const fatGoal = data.fatGoal || user.fatGoal || 65

    // Check if user has set their goals
    if (!user.calorieGoal && !data.calorieGoal) {
      return NextResponse.json(
        { 
          error: 'Please set your nutrition goals in Settings first',
          needsSetup: true 
        },
        { status: 400 }
      )
    }

    console.log('Generating meal plan with OpenAI...')
    
    // Generate meal plan using OpenAI
    const mealPlan = await generateMealPlan({
      calorieGoal,
      proteinGoal,
      carbGoal,
      fatGoal,
      dietaryPreference: data.dietaryPreference || user.dietaryPreference || 'omnivore',
      allergies: data.allergies || [],
      daysCount: data.daysCount,
    })

    console.log('Meal plan generated successfully')

    // Optionally: Save meal plan to database for future reference
    // await prisma.mealPlan.create({ ... })

    return NextResponse.json({
      mealPlan,
      message: 'Meal plan generated successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    
    console.error('Error generating meal plan:', error)
    return NextResponse.json(
      { error: 'Failed to generate meal plan' },
      { status: 500 }
    )
  }
}

