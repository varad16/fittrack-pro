import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getNutritionInsights } from '@/lib/openai'
import { z } from 'zod'

const insightsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
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
        currentWeight: true,
        goalWeight: true,
        activityLevel: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.calorieGoal) {
      return NextResponse.json(
        { 
          error: 'Please set your nutrition goals in Settings first',
          needsSetup: true 
        },
        { status: 400 }
      )
    }

    const body = await req.json()
    const data = insightsSchema.parse(body)

    // Default to last 7 days
    const endDate = data.endDate ? new Date(data.endDate) : new Date()
    const startDate = data.startDate 
      ? new Date(data.startDate) 
      : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)

    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 999)

    console.log('Fetching meals from', startDate, 'to', endDate)

    // Get meals for the period
    const meals = await prisma.meal.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        foodEntries: {
          select: {
            foodName: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    // Group meals by day
    const dailyData = new Map<string, {
      date: string
      totalCalories: number
      totalProtein: number
      totalCarbs: number
      totalFats: number
      meals: string[]
    }>()

    meals.forEach(meal => {
      const dateKey = meal.date.toISOString().split('T')[0]
      
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, {
          date: dateKey,
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFats: 0,
          meals: [],
        })
      }

      const dayData = dailyData.get(dateKey)!
      dayData.totalCalories += meal.totalCalories
      dayData.totalProtein += meal.totalProtein
      dayData.totalCarbs += meal.totalCarbs
      dayData.totalFats += meal.totalFats
      dayData.meals.push(
        ...meal.foodEntries.map(entry => entry.foodName)
      )
    })

    const weeklyData = Array.from(dailyData.values())

    if (weeklyData.length === 0) {
      return NextResponse.json(
        { 
          error: 'No meal data found for the selected period',
          needsData: true 
        },
        { status: 400 }
      )
    }

    console.log('Generating AI nutrition insights...')

    // Generate insights using OpenAI
    const insights = await getNutritionInsights({
      weeklyData,
      goals: {
        calories: user.calorieGoal,
        protein: user.proteinGoal || 0,
        carbs: user.carbGoal || 0,
        fats: user.fatGoal || 0,
      },
      userInfo: {
        currentWeight: user.currentWeight || undefined,
        goalWeight: user.goalWeight || undefined,
        activityLevel: user.activityLevel || undefined,
      },
    })

    console.log('Insights generated successfully')

    // Calculate some basic stats
    const avgDailyCalories = weeklyData.reduce((sum, day) => sum + day.totalCalories, 0) / weeklyData.length
    const avgDailyProtein = weeklyData.reduce((sum, day) => sum + day.totalProtein, 0) / weeklyData.length
    const avgDailyCarbs = weeklyData.reduce((sum, day) => sum + day.totalCarbs, 0) / weeklyData.length
    const avgDailyFats = weeklyData.reduce((sum, day) => sum + day.totalFats, 0) / weeklyData.length

    return NextResponse.json({
      insights,
      stats: {
        daysAnalyzed: weeklyData.length,
        avgDailyCalories: Math.round(avgDailyCalories),
        avgDailyProtein: Math.round(avgDailyProtein),
        avgDailyCarbs: Math.round(avgDailyCarbs),
        avgDailyFats: Math.round(avgDailyFats),
      },
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    
    console.error('Error generating nutrition insights:', error)
    return NextResponse.json(
      { error: 'Failed to generate nutrition insights' },
      { status: 500 }
    )
  }
}