import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const challengeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  challengeType: z.enum(['steps', 'distance', 'weight_loss', 'workout_count']),
  goalValue: z.number().positive('Goal value must be positive'),
  startDate: z.string(),
  endDate: z.string(),
  isPublic: z.boolean().optional(),
})

// GET - Get challenges
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') // 'active', 'completed', 'public'

    let challenges

    if (type === 'public') {
      // Get public challenges that user can join
      challenges = await prisma.challenge.findMany({
        where: {
          isPublic: true,
          endDate: { gte: new Date() }, // Not expired
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              participants: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    } else {
      // Get user's challenges (created or participating)
      challenges = await prisma.challenge.findMany({
        where: {
          OR: [
            { creatorId: session.user.id }, // Created by user
            { 
              participants: {
                some: { userId: session.user.id }
              }
            }, // Participating in
          ],
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              participants: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      if (type === 'active') {
        challenges = challenges.filter(c => new Date(c.endDate) >= new Date())
      } else if (type === 'completed') {
        challenges = challenges.filter(c => new Date(c.endDate) < new Date())
      }
    }

    return NextResponse.json({ challenges })
  } catch (error) {
    console.error('Error fetching challenges:', error)
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    )
  }
}

// POST - Create challenge
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = challengeSchema.parse(body)

    const challenge = await prisma.challenge.create({
      data: {
        creatorId: session.user.id,
        name: data.name,
        description: data.description,
        challengeType: data.challengeType,
        goalValue: data.goalValue,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isPublic: data.isPublic ?? true,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Auto-join creator to challenge
    await prisma.challengeParticipation.create({
      data: {
        challengeId: challenge.id,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ challenge }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    
  }
}