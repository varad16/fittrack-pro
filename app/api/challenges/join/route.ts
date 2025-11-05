import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Join challenge
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Fix authentication check
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user ID from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const params = await context.params
    const challengeId = params.id

    // Check if challenge exists and is not expired
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    })

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    if (new Date(challenge.endDate) < new Date()) {
      return NextResponse.json({ error: 'Challenge has expired' }, { status: 400 })
    }

    // Check if already participating
    const existingParticipant = await prisma.challengeParticipation.findUnique({
      where: {
        challengeId_userId: {
          challengeId,
          userId: user.id,
        },
      },
    })

    if (existingParticipant) {
      return NextResponse.json(
        { error: 'Already participating in this challenge' },
        { status: 400 }
      )
    }

    // Join challenge
    await prisma.challengeParticipation.create({
      data: {
        challengeId,
        userId: user.id,
      },
    })

    return NextResponse.json({ message: 'Joined challenge successfully' })
  } catch (error) {
    console.error('Error joining challenge:', error)
    return NextResponse.json(
      { error: 'Failed to join challenge' },
      { status: 500 }
    )
  }
}

// DELETE - Leave challenge
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Fix authentication check
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user ID from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const params = await context.params
    const challengeId = params.id

    // Leave challenge
    await prisma.challengeParticipation.delete({
      where: {
        challengeId_userId: {
          challengeId,
          userId: user.id,
        },
      },
    })

    return NextResponse.json({ message: 'Left challenge successfully' })
  } catch (error) {
    console.error('Error leaving challenge:', error)
    return NextResponse.json(
      { error: 'Failed to leave challenge' },
      { status: 500 }
    )
  }
}