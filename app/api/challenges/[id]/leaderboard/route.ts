import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get challenge leaderboard
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Fix the authentication check
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user ID from database using email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const params = await context.params
    const challengeId = params.id

    console.log('Looking for challenge:', challengeId)

    // Get challenge details
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    })

    console.log('Found challenge:', challenge)

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    // Try to get participants (simplified)
    const participants = await prisma.challengeParticipation.findMany({
      where: { challengeId },
    })

    console.log('Found participants:', participants)

    // Return simplified response for now
    return NextResponse.json({ 
      challenge,
      leaderboard: participants.map((p, index) => ({
        user: { id: p.userId, name: 'Test User', email: 'test@test.com' },
        progress: 0,
        progressPercentage: 0,
        joinedAt: p.joinedAt,
        isCompleted: false,
        rank: index + 1,
      }))
    })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: `Failed to fetch leaderboard: ${error}` },
      { status: 500 }
    )
  }
}