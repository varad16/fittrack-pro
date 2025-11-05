// ============================================
// 📂 FILE PATH: app/api/charts/progress/route.ts
// ============================================
// PURPOSE: Get progress data for charts
// ============================================

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '30')

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get weight logs
    const weightLogs = await prisma.weightLog.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
      select: {
        weight: true,
        date: true,
      },
    })

    // Get daily nutrition totals
    const meals = await prisma.meal.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        foodEntries: true,
      },
      orderBy: { date: 'asc' },
    })

    // Group meals by date and calculate totals
    const nutritionByDate = new Map<string, { calories: number; protein: number; carbs: number; fats: number }>()

    meals.forEach(meal => {
      const dateKey = meal.date.toISOString().split('T')[0]
      
      const mealTotals = meal.foodEntries.reduce(
        (acc, food) => ({
          calories: acc.calories + (food.calories * food.quantity),
          protein: acc.protein + (food.protein * food.quantity),
          carbs: acc.carbs + (food.carbs * food.quantity),
          fats: acc.fats + (food.fats * food.quantity),
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
      )

      const existing = nutritionByDate.get(dateKey) || { calories: 0, protein: 0, carbs: 0, fats: 0 }
      nutritionByDate.set(dateKey, {
        calories: existing.calories + mealTotals.calories,
        protein: existing.protein + mealTotals.protein,
        carbs: existing.carbs + mealTotals.carbs,
        fats: existing.fats + mealTotals.fats,
      })
    })

    // Convert to array format for charts
    const nutritionData = Array.from(nutritionByDate.entries()).map(([date, totals]) => ({
      date,
      ...totals,
    }))

    // Get workout frequency by week
    const workouts = await prisma.workout.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        duration: true,
      },
    })

    // Group workouts by week
    const workoutsByWeek = new Map<string, number>()
    workouts.forEach(workout => {
      const weekStart = new Date(workout.date)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start of week
      const weekKey = weekStart.toISOString().split('T')[0]
      
      workoutsByWeek.set(weekKey, (workoutsByWeek.get(weekKey) || 0) + 1)
    })

    const workoutData = Array.from(workoutsByWeek.entries()).map(([week, count]) => ({
      week,
      count,
    }))

    // Get user goals
    const goals = {
      calorieGoal: user.calorieGoal || 2000,
      proteinGoal: user.proteinGoal || 150,
      goalWeight: user.goalWeight || null,
    }

    return NextResponse.json({
      weightData: weightLogs.map(log => ({
        date: log.date.toISOString().split('T')[0],
        weight: log.weight,
      })),
      nutritionData,
      workoutData,
      goals,
    })
  } catch (error) {
    console.error('Charts API Error:', error)
    return NextResponse.json(
      { error: 'Failed to get chart data' },
      { status: 500 }
    )
  }
}

