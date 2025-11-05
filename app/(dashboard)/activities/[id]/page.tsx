'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, MapPin, Clock, TrendingUp, Zap } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { format } from 'date-fns'
import dynamic from 'next/dynamic'

const MapComponent = dynamic(() => import('@/components/ActivityMap'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">Loading map...</div>
})

interface Position {
  lat: number
  lng: number
}

interface Activity {
  id: string
  activityType: string
  name?: string | null
  startTime: Date
  endTime?: Date | null
  distance?: number | null
  duration?: number | null
  avgPace?: number | null
  elevationGain?: number | null
  calories?: number | null
  routeData?: any
}

export default function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [activity, setActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivity()
  }, [resolvedParams.id])

  const fetchActivity = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/activities/${resolvedParams.id}`)
      const data = await res.json()
      
      if (res.ok) {
        setActivity(data.activity)
      } else {
        toast.error('Failed to fetch activity')
        router.push('/activities')
      }
    } catch (error) {
      toast.error('Something went wrong')
      router.push('/activities')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    }
    return `${minutes}m ${secs}s`
  }

  const formatPace = (paceMinPerKm: number) => {
    const minutes = Math.floor(paceMinPerKm)
    const seconds = Math.round((paceMinPerKm - minutes) * 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`
  }

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      running: '🏃',
      cycling: '🚴',
      walking: '🚶',
      hiking: '🥾',
    }
    return icons[type] || '🏃'
  }

  if (loading) {
    return <div className="text-center py-12">Loading activity...</div>
  }

  if (!activity) {
    return null
  }

  // Parse route data for map
  const positions: Position[] = activity.routeData?.coordinates?.map((coord: [number, number]) => ({
    lng: coord[0],
    lat: coord[1],
  })) || []

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/activities">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{getActivityIcon(activity.activityType)}</span>
            <h1 className="text-3xl font-bold text-gray-900 capitalize">
              {activity.name || `${activity.activityType} Activity`}
            </h1>
          </div>
          <p className="text-gray-600 mt-1">
            {format(new Date(activity.startTime), 'EEEE, MMMM d, yyyy • h:mm a')}
          </p>
        </div>
      </div>

      {/* Map */}
      {positions.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <MapComponent positions={positions} />
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {activity.distance && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Distance</CardTitle>
              <MapPin className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activity.distance.toFixed(2)} km</div>
            </CardContent>
          </Card>
        )}

        {activity.duration && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Duration</CardTitle>
              <Clock className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(activity.duration)}</div>
            </CardContent>
          </Card>
        )}

        {activity.avgPace && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Pace</CardTitle>
              <Zap className="w-4 h-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPace(activity.avgPace)}</div>
            </CardContent>
          </Card>
        )}

        {activity.calories && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Calories</CardTitle>
              <TrendingUp className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(activity.calories)}</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Additional Stats */}
      {activity.elevationGain && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Elevation Gain</p>
                <p className="text-xl font-bold">{Math.round(activity.elevationGain)} meters</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Route Details */}
      {positions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Route Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">GPS Points Recorded:</span>
                <span className="font-semibold">{positions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Start Time:</span>
                <span className="font-semibold">
                  {format(new Date(activity.startTime), 'h:mm:ss a')}
                </span>
              </div>
              {activity.endTime && (
                <div className="flex justify-between">
                  <span className="text-gray-600">End Time:</span>
                  <span className="font-semibold">
                    {format(new Date(activity.endTime), 'h:mm:ss a')}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}