'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, MapPin, Clock, TrendingUp, Trash2, Play } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { format } from 'date-fns'

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
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/activities?limit=20')
      const data = await res.json()
      
      if (res.ok) {
        setActivities(data.activities)
      } else {
        toast.error('Failed to fetch activities')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const deleteActivity = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return

    try {
      const res = await fetch(`/api/activities/${activityId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Activity deleted!')
        fetchActivities()
      } else {
        toast.error('Failed to delete activity')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
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

  const totalDistance = activities.reduce((sum, a) => sum + (a.distance || 0), 0)
  const totalDuration = activities.reduce((sum, a) => sum + (a.duration || 0), 0)
  const totalCalories = activities.reduce((sum, a) => sum + (a.calories || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activities</h1>
          <p className="text-gray-600 mt-1">Track your outdoor workouts with GPS</p>
        </div>
        <Link href="/activities/record">
          <Button>
            <Play className="w-4 h-4 mr-2" />
            Start Activity
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Distance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDistance.toFixed(1)} km</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(totalDuration)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Calories Burned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(totalCalories)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Activities List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
        {loading ? (
          <p className="text-gray-500 text-center py-8">Loading activities...</p>
        ) : activities.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No activities yet</p>
              <Link href="/activities/record">
                <Button>
                  <Play className="w-4 h-4 mr-2" />
                  Start Your First Activity
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <Card key={activity.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <Link href={`/activities/${activity.id}`} className="flex-1">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getActivityIcon(activity.activityType)}</span>
                          <h3 className="text-lg font-semibold capitalize">
                            {activity.name || `${activity.activityType} Activity`}
                          </h3>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {format(new Date(activity.startTime), 'MMM d, yyyy h:mm a')}
                          </div>
                        </div>
                        <div className="flex gap-6 text-sm">
                          {activity.distance && (
                            <div>
                              <span className="text-gray-600">Distance: </span>
                              <span className="font-semibold">{activity.distance.toFixed(2)} km</span>
                            </div>
                          )}
                          {activity.duration && (
                            <div>
                              <span className="text-gray-600">Duration: </span>
                              <span className="font-semibold">{formatDuration(activity.duration)}</span>
                            </div>
                          )}
                          {activity.avgPace && (
                            <div>
                              <span className="text-gray-600">Avg Pace: </span>
                              <span className="font-semibold">{formatPace(activity.avgPace)}</span>
                            </div>
                          )}
                          {activity.calories && (
                            <div>
                              <span className="text-gray-600">Calories: </span>
                              <span className="font-semibold">{Math.round(activity.calories)}</span>
                            </div>
                          )}
                        </div>
                        {activity.elevationGain && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <TrendingUp className="w-4 h-4" />
                            Elevation Gain: {Math.round(activity.elevationGain)}m
                          </div>
                        )}
                      </div>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteActivity(activity.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}