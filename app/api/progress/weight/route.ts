import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const weightLogSchema = z.object({
  weight: z.number().positive('Weight must be positive'),
  date: z.string().optional(),
  notes: z.string().optional(),
})

// GET - Get weight logs
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '30')

    const weightLogs = await prisma.weightLog.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: { date: 'desc' },
      take: limit,
    })

    return NextResponse.json({ weightLogs })
  } catch (error) {
    console.error('Error fetching weight logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weight logs' },
      { status: 500 }
    )
  }
}

// POST - Create weight log
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { weight, date, notes } = weightLogSchema.parse(body)

    const logDate = date ? new Date(date) : new Date()

    const weightLog = await prisma.weightLog.create({
      data: {
        userId: session.user.id,
        weight,
        date: logDate,
        notes: notes || null,
      },
    })

    return NextResponse.json({ weightLog }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    
    console.error('Error creating weight log:', error)
    return NextResponse.json(
      { error: 'Failed to create weight log' },
      { status: 500 }
    )
  }
}

// DELETE - Delete weight log
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const logId = searchParams.get('logId')

    if (!logId) {
      return NextResponse.json(
        { error: 'logId is required' },
        { status: 400 }
      )
    }

    const weightLog = await prisma.weightLog.findUnique({
      where: { id: logId },
      select: { userId: true },
    })

    if (!weightLog) {
      return NextResponse.json(
        { error: 'Weight log not found' },
        { status: 404 }
      )
    }

    if (weightLog.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.weightLog.delete({
      where: { id: logId },
    })

    return NextResponse.json({ message: 'Weight log deleted' })
  } catch (error) {
    console.error('Error deleting weight log:', error)
    return NextResponse.json(
      { error: 'Failed to delete weight log' },
      { status: 500 }
    )
  }
}