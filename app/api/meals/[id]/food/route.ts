import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const foodEntrySchema = z.object({
  foodName: z.string(),
  brand: z.string().optional().nullable(),
  servingSize: z.string(),
  servingUnit: z.string(),
  quantity: z.number().positive(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fats: z.number(),
  fiber: z.number().optional().nullable(),
  sugar: z.number().optional().nullable(),
  sodium: z.number().optional().nullable(),
})

// POST - Add food to meal
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
    const mealId = params.id

    console.log('MealId:', mealId) // Debug log

    // Verify meal belongs to user
    const meal = await prisma.meal.findFirst({
      where: {
        id: mealId,
        userId: session.user.id,
      },
    })

    if (!meal) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 })
    }

    const body = await req.json()
    const foodData = foodEntrySchema.parse(body)

    // Add food entry
    const foodEntry = await prisma.foodEntry.create({
      data: {
        meal: {
          connect: {
            id: mealId
          }
        },
        foodName: foodData.foodName,
        brand: foodData.brand || null,
        servingSize: foodData.servingSize,
        servingUnit: foodData.servingUnit,
        quantity: foodData.quantity,
        calories: foodData.calories,
        protein: foodData.protein,
        carbs: foodData.carbs,
        fats: foodData.fats,
        fiber: foodData.fiber || null,
        sugar: foodData.sugar || null,
        sodium: foodData.sodium || null,
      },
    })

    // Update meal totals
    const updatedMeal = await prisma.meal.update({
      where: { id: mealId },
      data: {
        totalCalories: {
          increment: foodData.calories * foodData.quantity,
        },
        totalProtein: {
          increment: foodData.protein * foodData.quantity,
        },
        totalCarbs: {
          increment: foodData.carbs * foodData.quantity,
        },
        totalFats: {
          increment: foodData.fats * foodData.quantity,
        },
      },
      include: {
        foodEntries: true,
      },
    })

    return NextResponse.json({ meal: updatedMeal, foodEntry }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    
    console.error('Error adding food:', error)
    return NextResponse.json(
      { error: 'Failed to add food' },
      { status: 500 }
    )
  }
}

// DELETE - Remove food from meal
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const mealId = params.id

    const { searchParams } = new URL(req.url)
    const foodEntryId = searchParams.get('foodEntryId')

    if (!foodEntryId) {
      return NextResponse.json(
        { error: 'foodEntryId is required' },
        { status: 400 }
      )
    }

    // Get food entry
    const foodEntry = await prisma.foodEntry.findUnique({
      where: { id: foodEntryId },
      include: {
        meal: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!foodEntry) {
      return NextResponse.json(
        { error: 'Food entry not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (foodEntry.meal.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete food entry
    await prisma.foodEntry.delete({
      where: { id: foodEntryId },
    })

    // Update meal totals
    const updatedMeal = await prisma.meal.update({
      where: { id: mealId },
      data: {
        totalCalories: {
          decrement: foodEntry.calories * foodEntry.quantity,
        },
        totalProtein: {
          decrement: foodEntry.protein * foodEntry.quantity,
        },
        totalCarbs: {
          decrement: foodEntry.carbs * foodEntry.quantity,
        },
        totalFats: {
          decrement: foodEntry.fats * foodEntry.quantity,
        },
      },
      include: {
        foodEntries: true,
      },
    })

    return NextResponse.json({ meal: updatedMeal })
  } catch (error) {
    console.error('Error deleting food:', error)
    return NextResponse.json(
      { error: 'Failed to delete food' },
      { status: 500 }
    )
  }
}