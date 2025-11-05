import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get activity feed from followed users
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get users that current user follows
    const following = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    })

    const followingIds = following.map(f => f.followingId)
    
    // Include current user's activities too
    const userIds = [...followingIds, session.user.id]

    // Get recent activities from followed users + self
    const activities = await prisma.activity.findMany({
      where: {
        userId: { in: userIds },
        isPublic: true, // Only public activities
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
      take: limit,
    })

    // Get recent workouts from followed users + self
    const workouts = await prisma.workout.findMany({
      where: {
        userId: { in: userIds },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        exercises: {
          take: 3, // Just show first 3 exercises
        },
      },
      orderBy: { date: 'desc' },
      take: limit,
    })

    // Combine and sort by date
    const feedItems = [
      ...activities.map(activity => ({
        type: 'activity' as const,
        id: activity.id,
        user: activity.user,
        date: activity.startTime,
        data: activity,
      })),
      ...workouts.map(workout => ({
        type: 'workout' as const,
        id: workout.id,
        user: workout.user,
        date: workout.date,
        data: workout,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({ feedItems: feedItems.slice(0, limit) })
  } catch (error) {
    console.error('Error fetching feed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feed' },
      { status: 500 }
    )
  }
}