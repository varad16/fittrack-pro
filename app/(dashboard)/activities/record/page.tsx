'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, Play, Pause, Square, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Import map component dynamically (no SSR)
const MapComponent = dynamic(() => import('@/components/ActivityMap'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">Loading map...</div>
})

interface Position {
  lat: number
  lng: number
  timestamp: number
  altitude?: number
}

export default function RecordActivityPage() {
  const router = useRouter()
  const [activityType, setActivityType] = useState<'running' | 'cycling' | 'walking' | 'hiking'>('running')
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [positions, setPositions] = useState<Position[]>([])
  const [distance, setDistance] = useState(0)
  const [duration, setDuration] = useState(0)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [activityName, setActivityName] = useState('')
  const [saving, setSaving] = useState(false)

  const watchIdRef = useRef<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Start recording
  const startRecording = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setIsRecording(true)
    setIsPaused(false)
    setStartTime(new Date())
    setPositions([])
    setDistance(0)
    setDuration(0)

    // Start tracking position
    
    // Start tracking position
watchIdRef.current = navigator.geolocation.watchPosition(
    (position) => {
      const newPos: Position = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: position.timestamp,
        altitude: position.coords.altitude || undefined,
      }
  
      setPositions((prev) => {
        const updated = [...prev, newPos]
        
        // Calculate distance only if movement is significant
        if (prev.length > 0) {
          const lastPos = prev[prev.length - 1]
          const dist = calculateDistance(lastPos.lat, lastPos.lng, newPos.lat, newPos.lng)
          
          // Only count movement if distance > 5 meters (to filter GPS noise)
          if (dist > 0.005) { // 0.005 km = 5 meters
            setDistance((d) => d + dist)
          }
        }
        
        return updated
      })
    },
    (error) => {
      console.error('Geolocation error:', error)
      toast.error('Failed to get your location')
    },
    {
      enableHighAccuracy: true,
      maximumAge: 1000,      // Use GPS data max 1 second old
      timeout: 10000,        // Wait max 10 seconds for position
    }
  )

    // Start timer
    intervalRef.current = setInterval(() => {
      setDuration((d) => d + 1)
    }, 1000)

    toast.success('Recording started!')
  }

  // Pause recording
  const pauseRecording = () => {
    setIsPaused(true)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

  // Resume recording
  const resumeRecording = () => {
    setIsPaused(false)
    intervalRef.current = setInterval(() => {
      setDuration((d) => d + 1)
    }, 1000)
  }

  // Stop recording
  const stopRecording = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setIsRecording(false)
    setIsPaused(false)
    
    if (positions.length > 0) {
      setSaveDialogOpen(true)
    } else {
      toast.error('No GPS data recorded')
    }
  }

  // Save activity
  const saveActivity = async () => {
    if (positions.length === 0) {
      toast.error('No GPS data to save')
      return
    }

    try {
      setSaving(true)

      // Calculate stats
      const avgPace = duration > 0 && distance > 0 ? (duration / 60) / distance : 0
      const elevationGain = positions.reduce((gain, pos, idx) => {
        if (idx === 0 || !pos.altitude || !positions[idx - 1].altitude) return gain
        const diff = pos.altitude - positions[idx - 1].altitude!
        return diff > 0 ? gain + diff : gain
      }, 0)

      // Estimate calories (rough estimate based on activity type)
      const caloriesPerKm: Record<string, number> = {
        running: 60,
        cycling: 30,
        walking: 50,
        hiking: 55,
      }
      const calories = distance * caloriesPerKm[activityType]

      // Create GeoJSON route
      const routeData = {
        type: 'LineString',
        coordinates: positions.map(p => [p.lng, p.lat]),
      }

      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType,
          name: activityName || null,
          startTime: startTime?.toISOString(),
          endTime: new Date().toISOString(),
          distance: parseFloat(distance.toFixed(2)),
          duration,
          avgPace: parseFloat(avgPace.toFixed(2)),
          elevationGain: Math.round(elevationGain),
          calories: Math.round(calories),
          routeData,
          isPublic: false,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success('Activity saved!')
        router.push(`/activities/${data.activity.id}`)
      } else {
        toast.error('Failed to save activity')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const currentPace = duration > 0 && distance > 0 ? (duration / 60) / distance : 0

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/activities">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Record Activity</h1>
          <p className="text-gray-600 mt-1">Track your route with GPS</p>
        </div>
      </div>

      {!isRecording && (
        <Card>
          <CardHeader>
            <CardTitle>Activity Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={activityType}
              onValueChange={(value: any) => setActivityType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="running">🏃 Running</SelectItem>
                <SelectItem value="cycling">🚴 Cycling</SelectItem>
                <SelectItem value="walking">🚶 Walking</SelectItem>
                <SelectItem value="hiking">🥾 Hiking</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {isRecording && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Distance</p>
                <p className="text-2xl font-bold">{distance.toFixed(2)} km</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Duration</p>
                <p className="text-2xl font-bold">{formatDuration(duration)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Pace</p>
                <p className="text-2xl font-bold">
                  {currentPace > 0 ? `${currentPace.toFixed(1)} min/km` : '--'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Points</p>
                <p className="text-2xl font-bold">{positions.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Map */}
      <Card>
        <CardContent className="p-4">
          <MapComponent positions={positions} />
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center gap-4">
            {!isRecording ? (
              <Button size="lg" onClick={startRecording}>
                <Play className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            ) : (
              <>
                {!isPaused ? (
                  <Button size="lg" variant="outline" onClick={pauseRecording}>
                    <Pause className="w-5 h-5 mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button size="lg" onClick={resumeRecording}>
                    <Play className="w-5 h-5 mr-2" />
                    Resume
                  </Button>
                )}
                <Button size="lg" variant="destructive" onClick={stopRecording}>
                  <Square className="w-5 h-5 mr-2" />
                  Stop & Save
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Dialog */}
     {/* Save Dialog */}
<Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
  <DialogContent className="z-[9999] max-w-md">
    <DialogHeader>
      <DialogTitle>Save Activity</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      <div>
        <Label>Activity Name (optional)</Label>
        <Input
          placeholder={`${activityType.charAt(0).toUpperCase() + activityType.slice(1)} on ${new Date().toLocaleDateString()}`}
          value={activityName}
          onChange={(e) => setActivityName(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Distance</p>
          <p className="font-semibold">{distance.toFixed(2)} km</p>
        </div>
        <div>
          <p className="text-gray-600">Duration</p>
          <p className="font-semibold">{formatDuration(duration)}</p>
        </div>
        <div>
          <p className="text-gray-600">Avg Pace</p>
          <p className="font-semibold">{currentPace.toFixed(1)} min/km</p>
        </div>
        <div>
          <p className="text-gray-600">GPS Points</p>
          <p className="font-semibold">{positions.length}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => {
            setSaveDialogOpen(false)
            router.push('/activities')
          }}
        >
          Discard
        </Button>
        <Button 
          className="flex-1"
          onClick={saveActivity}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Activity'}
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
    </div>
  )
}