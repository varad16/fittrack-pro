import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const measurementSchema = z.object({
  date: z.string().optional(),
  neck: z.number().optional().nullable(),
  chest: z.number().optional().nullable(),
  waist: z.number().optional().nullable(),
  hips: z.number().optional().nullable(),
  bicepLeft: z.number().optional().nullable(),
  bicepRight: z.number().optional().nullable(),
  thighLeft: z.number().optional().nullable(),
  thighRight: z.number().optional().nullable(),
  calfLeft: z.number().optional().nullable(),
  calfRight: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
})

// GET - Get measurements
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const measurements = await prisma.bodyMeasurement.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: { date: 'desc' },
      take: limit,
    })

    return NextResponse.json({ measurements })
  } catch (error) {
    console.error('Error fetching measurements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch measurements' },
      { status: 500 }
    )
  }
}

// POST - Create measurement
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    console.log('Received body:', body) // Debug log
    
    const data = measurementSchema.parse(body)
    console.log('Parsed data:', data) // Debug log

    // Check if at least one measurement is provided
    const hasMeasurement = 
      data.neck || data.chest || data.waist || data.hips ||
      data.bicepLeft || data.bicepRight || data.thighLeft || 
      data.thighRight || data.calfLeft || data.calfRight

    if (!hasMeasurement) {
      return NextResponse.json(
        { error: 'Please provide at least one measurement' },
        { status: 400 }
      )
    }

    const measurementDate = data.date ? new Date(data.date) : new Date()

    const measurement = await prisma.bodyMeasurement.create({
      data: {
        userId: session.user.id,
        date: measurementDate,
        neck: data.neck ?? null,
        chest: data.chest ?? null,
        waist: data.waist ?? null,
        hips: data.hips ?? null,
        bicepLeft: data.bicepLeft ?? null,
        bicepRight: data.bicepRight ?? null,
        thighLeft: data.thighLeft ?? null,
        thighRight: data.thighRight ?? null,
        calfLeft: data.calfLeft ?? null,
        calfRight: data.calfRight ?? null,
        notes: data.notes || null,
      },
    })

    return NextResponse.json({ measurement }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', error.issues) // Debug log
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    
    console.error('Error creating measurement:', error)
    return NextResponse.json(
      { error: 'Failed to create measurement' },
      { status: 500 }
    )
  }
}
// DELETE - Delete measurement
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const measurementId = searchParams.get('measurementId')

    if (!measurementId) {
      return NextResponse.json(
        { error: 'measurementId is required' },
        { status: 400 }
      )
    }

    const measurement = await prisma.bodyMeasurement.findUnique({
      where: { id: measurementId },
      select: { userId: true },
    })

    if (!measurement) {
      return NextResponse.json(
        { error: 'Measurement not found' },
        { status: 404 }
      )
    }

    if (measurement.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.bodyMeasurement.delete({
      where: { id: measurementId },
    })

    return NextResponse.json({ message: 'Measurement deleted' })
  } catch (error) {
    console.error('Error deleting measurement:', error)
    return NextResponse.json(
      { error: 'Failed to delete measurement' },
      { status: 500 }
    )
  }
}