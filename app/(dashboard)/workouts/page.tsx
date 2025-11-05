'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Dumbbell, Calendar, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { format } from 'date-fns'

interface Exercise {
  id: string
  exerciseName: string
  exerciseType: string
  sets?: number
  reps?: number
  weight?: number
  duration?: number
  distance?: number
}

interface Workout {
  id: string
  name: string
  date: Date
  duration?: number
  caloriesBurned?: number
  exercises: Exercise[]
}

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newWorkout, setNewWorkout] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  useEffect(() => {
    fetchWorkouts()
  }, [])

  const fetchWorkouts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/workouts?limit=20')
      const data = await res.json()
      
      if (res.ok) {
        setWorkouts(data.workouts)
      } else {
        toast.error('Failed to fetch workouts')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const createWorkout = async () => {
    if (!newWorkout.name.trim()) {
      toast.error('Workout name is required')
      return
    }

    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorkout),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success('Workout created!')
        setDialogOpen(false)
        setNewWorkout({ name: '', date: new Date().toISOString().split('T')[0], notes: '' })
        // Navigate to workout detail page
        window.location.href = `/workouts/${data.workout.id}`
      } else {
        toast.error('Failed to create workout')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const deleteWorkout = async (workoutId: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) return

    try {
      const res = await fetch(`/api/workouts/${workoutId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Workout deleted!')
        fetchWorkouts()
      } else {
        toast.error('Failed to delete workout')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const getExerciseSummary = (exercises: Exercise[]) => {
    const count = exercises.length
    const types = [...new Set(exercises.map(e => e.exerciseType))]
    return `${count} exercises${types.length > 0 ? ` • ${types.join(', ')}` : ''}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workouts</h1>
          <p className="text-gray-600 mt-1">Track your training sessions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Workout
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Workout</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Workout Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Upper Body, Leg Day"
                  value={newWorkout.name}
                  onChange={(e) => setNewWorkout({ ...newWorkout, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newWorkout.date}
                  onChange={(e) => setNewWorkout({ ...newWorkout, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  placeholder="Any notes about this workout"
                  value={newWorkout.notes}
                  onChange={(e) => setNewWorkout({ ...newWorkout, notes: e.target.value })}
                />
              </div>
              <Button onClick={createWorkout} className="w-full">
                Create Workout
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Workouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workouts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workouts.filter(w => {
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return new Date(w.date) >= weekAgo
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Exercises</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workouts.reduce((sum, w) => sum + w.exercises.length, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workouts List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Workouts</h2>
        {loading ? (
          <p className="text-gray-500 text-center py-8">Loading workouts...</p>
        ) : workouts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Dumbbell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No workouts yet</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Workout
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {workouts.map((workout) => (
              <Card key={workout.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <Link href={`/workouts/${workout.id}`} className="flex-1">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">{workout.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(workout.date), 'MMM d, yyyy')}
                          </div>
                          {workout.duration && (
                            <div>{workout.duration} min</div>
                          )}
                          {workout.caloriesBurned && (
                            <div>{workout.caloriesBurned} cal</div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {getExerciseSummary(workout.exercises)}
                        </p>
                      </div>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteWorkout(workout.id)}
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