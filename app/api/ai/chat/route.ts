// ============================================
// 📂 FILE PATH: app/api/ai/chat/route.ts
// ============================================
// PURPOSE: AI Chat Assistant API
// ============================================

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { chatWithFitnessCoach } from '@/lib/openai'
import { z } from 'zod'

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  chatId: z.string().optional(),
})

// Helper to get user context
async function getUserContext(userId: string) {
  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      calorieGoal: true,
      proteinGoal: true,
      currentWeight: true,
      goalWeight: true,
    },
  })

  // Get today's meals
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayMeals = await prisma.meal.findMany({
    where: {
      userId,
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
    include: {
      foodEntries: true,
    },
  })

  const todayTotals = todayMeals.reduce((acc, meal) => {
    const mealTotals = meal.foodEntries.reduce(
      (mealAcc, food) => ({
        calories: mealAcc.calories + (food.calories * food.quantity),
        protein: mealAcc.protein + (food.protein * food.quantity),
      }),
      { calories: 0, protein: 0 }
    )
    return {
      calories: acc.calories + mealTotals.calories,
      protein: acc.protein + mealTotals.protein,
    }
  }, { calories: 0, protein: 0 })

  // Get this week's workouts
  const startOfWeek = new Date()
  startOfWeek.setDate(today.getDate() - today.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const weekWorkouts = await prisma.workout.count({
    where: {
      userId,
      date: {
        gte: startOfWeek,
      },
    },
  })

  return {
    name: user?.name || undefined,
    goals: {
      calorieGoal: user?.calorieGoal || undefined,
      proteinGoal: user?.proteinGoal || undefined,
      currentWeight: user?.currentWeight || undefined,
      goalWeight: user?.goalWeight || undefined,
    },
    recentActivity: {
      todayCalories: todayTotals.calories,
      todayProtein: todayTotals.protein,
      weekWorkouts,
    },
  }
}

export async function POST(req: Request) {
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

    const body = await req.json()
    const { message, chatId } = chatSchema.parse(body)

    console.log('💬 Processing chat message:', message.substring(0, 50) + '...')

    // Get or create chat
    let chat
    if (chatId) {
      chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 20, // Last 20 messages for context
          },
        },
      })
      if (!chat || chat.userId !== user.id) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
      }
    } else {
      // Create new chat
      chat = await prisma.chat.create({
        data: {
          userId: user.id,
          title: message.substring(0, 50), // First message as title
        },
        include: {
          messages: true,
        },
      })
    }

    // Save user message
    await prisma.message.create({
      data: {
        chatId: chat.id,
        role: 'user',
        content: message,
      },
    })

    // Get user context
    const userContext = await getUserContext(user.id)

    // Get AI response
    const chatHistory = chat.messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))

    const aiResponse = await chatWithFitnessCoach({
      message,
      chatHistory,
      userContext,
    })

    // Save AI response
    const savedMessage = await prisma.message.create({
      data: {
        chatId: chat.id,
        role: 'assistant',
        content: aiResponse.content,
      },
    })

    console.log('✅ Chat response saved')

    return NextResponse.json({
      chatId: chat.id,
      message: {
        id: savedMessage.id,
        role: savedMessage.role,
        content: savedMessage.content,
        createdAt: savedMessage.createdAt,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Chat API Error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}

// Get chat history
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
    const chatId = searchParams.get('chatId')

    if (chatId) {
      // Get specific chat with messages
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      })

      if (!chat || chat.userId !== user.id) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
      }

      return NextResponse.json({ chat })
    } else {
      // Get all user's chats
      const chats = await prisma.chat.findMany({
        where: { userId: user.id },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1, // Just the last message for preview
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      })

      return NextResponse.json({ chats })
    }
  } catch (error) {
    console.error('Get chats error:', error)
    return NextResponse.json(
      { error: 'Failed to get chats' },
      { status: 500 }
    )
  }
}
