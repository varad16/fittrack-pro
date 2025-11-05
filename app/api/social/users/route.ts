import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Search users
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('query')
    const limit = parseInt(searchParams.get('limit') || '10')

    let users

    if (query) {
      // Search users by name or email
      users = await prisma.user.findMany({
        where: {
          AND: [
            { id: { not: session.user.id } }, // Exclude current user
            {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
              ],
            },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
          _count: {
            select: {
              workouts: true,
              activities: true,
              followers: true,
              following: true,
            },
          },
        },
        take: limit,
      })
    } else {
      // Get all users (for discovery)
      users = await prisma.user.findMany({
        where: {
          id: { not: session.user.id },
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
          _count: {
            select: {
              workouts: true,
              activities: true,
              followers: true,
              following: true,
            },
          },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

