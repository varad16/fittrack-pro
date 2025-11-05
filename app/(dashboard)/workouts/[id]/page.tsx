'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ArrowLeft, Plus, Trash2, Dumbbell, Timer, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { format } from 'date-fns'

interface Exercise {
  id: string
  exerciseName: string
  exerciseType: string
  sets?: number | null
  reps?: number | null
  weight?: number | null
  duration?: number | null
  distance?: number | null
  restTime?: number | null
  notes?: string | null
}

interface Workout {
  id: string
  name: string
  date: Date
  duration?: number | null
  caloriesBurned?: number | null
  notes?: string | null
  exercises: Exercise[]
}

// Pre-defined exercise library
const EXERCISE_LIBRARY = {
  strength: [
    'Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row',
    'Pull-ups', 'Dips', 'Bicep Curls', 'Tricep Extensions', 'Lateral Raises',
    'Leg Press', 'Lunges', 'Romanian Deadlift', 'Chest Fly', 'Shoulder Press'
  ],
  cardio: [
    'Running', 'Cycling', 'Swimming', 'Rowing', 'Elliptical',
    'Jump Rope', 'Stair Climbing', 'Walking', 'Sprints', 'HIIT'
  ],
  flexibility: [
    'Yoga', 'Stretching', 'Foam Rolling', 'Pilates', 'Mobility Work'
  ]
}

export default function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newExercise, setNewExercise] = useState({
    exerciseName: '',
    exerciseType: 'strength' as 'strength' | 'cardio' | 'flexibility',
    sets: '',
    reps: '',
    weight: '',
    duration: '',
    distance: '',
    restTime: '',
    notes: '',
  })

  useEffect(() => {
    fetchWorkout()
  }, [resolvedParams.id])

  const fetchWorkout = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/workouts/${resolvedParams.id}`)
      const data = await res.json()
      
      if (res.ok) {
        setWorkout(data.workout)
      } else {
        toast.error('Failed to fetch workout')
        router.push('/workouts')
      }
    } catch (error) {
      toast.error('Something went wrong')
      router.push('/workouts')
    } finally {
      setLoading(false)
    }
  }

  const addExercise = async () => {
    if (!newExercise.exerciseName.trim()) {
      toast.error('Exercise name is required')
      return
    }

    try {
      const res = await fetch(`/api/workouts/${resolvedParams.id}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseName: newExercise.exerciseName,
          exerciseType: newExercise.exerciseType,
          sets: newExercise.sets ? parseInt(newExercise.sets) : null,
          reps: newExercise.reps ? parseInt(newExercise.reps) : null,
          weight: newExercise.weight ? parseFloat(newExercise.weight) : null,
          duration: newExercise.duration ? parseInt(newExercise.duration) : null,
          distance: newExercise.distance ? parseFloat(newExercise.distance) : null,
          restTime: newExercise.restTime ? parseInt(newExercise.restTime) : null,
          notes: newExercise.notes || null,
        }),
      })

      if (res.ok) {
        toast.success('Exercise added!')
        setDialogOpen(false)
        setNewExercise({
          exerciseName: '',
          exerciseType: 'strength',
          sets: '',
          reps: '',
          weight: '',
          duration: '',
          distance: '',
          restTime: '',
          notes: '',
        })
        fetchWorkout()
      } else {
        toast.error('Failed to add exercise')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const deleteExercise = async (exerciseId: string) => {
    try {
      const res = await fetch(
        `/api/workouts/${resolvedParams.id}/exercises?exerciseId=${exerciseId}`,
        { method: 'DELETE' }
      )

      if (res.ok) {
        toast.success('Exercise removed!')
        fetchWorkout()
      } else {
        toast.error('Failed to remove exercise')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading workout...</div>
  }

  if (!workout) {
    return null
  }

  const totalSets = workout.exercises.reduce((sum, e) => sum + (e.sets || 0), 0)
  const totalVolume = workout.exercises.reduce(
    (sum, e) => sum + ((e.sets || 0) * (e.reps || 0) * (e.weight || 0)),
    0
  )

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/workouts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{workout.name}</h1>
          <p className="text-gray-600 mt-1">
            {format(new Date(workout.date), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Exercise
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Exercise</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Exercise Type</Label>
                <Select
                  value={newExercise.exerciseType}
                  onValueChange={(value: 'strength' | 'cardio' | 'flexibility') =>
                    setNewExercise({ ...newExercise, exerciseType: value, exerciseName: '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strength">Strength Training</SelectItem>
                    <SelectItem value="cardio">Cardio</SelectItem>
                    <SelectItem value="flexibility">Flexibility</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Exercise Name</Label>
                <Select
                  value={newExercise.exerciseName}
                  onValueChange={(value) =>
                    setNewExercise({ ...newExercise, exerciseName: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an exercise" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXERCISE_LIBRARY[newExercise.exerciseType].map((exercise) => (
                      <SelectItem key={exercise} value={exercise}>
                        {exercise}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Or type custom name in the field above
                </p>
                <Input
                  placeholder="Or enter custom exercise name"
                  value={newExercise.exerciseName}
                  onChange={(e) =>
                    setNewExercise({ ...newExercise, exerciseName: e.target.value })
                  }
                  className="mt-2"
                />
              </div>

              {newExercise.exerciseType === 'strength' && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Sets</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="3"
                        value={newExercise.sets}
                        onChange={(e) =>
                          setNewExercise({ ...newExercise, sets: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Reps</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="10"
                        value={newExercise.reps}
                        onChange={(e) =>
                          setNewExercise({ ...newExercise, reps: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Weight (kg)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="20"
                        value={newExercise.weight}
                        onChange={(e) =>
                          setNewExercise({ ...newExercise, weight: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Rest Time (seconds)</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="60"
                      value={newExercise.restTime}
                      onChange={(e) =>
                        setNewExercise({ ...newExercise, restTime: e.target.value })
                      }
                    />
                  </div>
                </>
              )}

              {newExercise.exerciseType === 'cardio' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="30"
                      value={newExercise.duration}
                      onChange={(e) =>
                        setNewExercise({ ...newExercise, duration: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Distance (km)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="5"
                      value={newExercise.distance}
                      onChange={(e) =>
                        setNewExercise({ ...newExercise, distance: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}

              {newExercise.exerciseType === 'flexibility' && (
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="15"
                    value={newExercise.duration}
                    onChange={(e) =>
                      setNewExercise({ ...newExercise, duration: e.target.value })
                    }
                  />
                </div>
              )}

              <div>
                <Label>Notes (optional)</Label>
                <Input
                  placeholder="Any notes about this exercise"
                  value={newExercise.notes}
                  onChange={(e) =>
                    setNewExercise({ ...newExercise, notes: e.target.value })
                  }
                />
              </div>

              <Button onClick={addExercise} className="w-full">
                Add Exercise
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Exercises
            </CardTitle>
            <Dumbbell className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workout.exercises.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Sets</CardTitle>
            <Timer className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Volume
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(totalVolume)} kg</div>
            <p className="text-xs text-gray-600">sets × reps × weight</p>
          </CardContent>
        </Card>
      </div>

      {/* Exercises List */}
      <Card>
        <CardHeader>
          <CardTitle>Exercises</CardTitle>
        </CardHeader>
        <CardContent>
          {workout.exercises.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">No exercises added yet</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Exercise
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {workout.exercises.map((exercise, index) => (
                <div
                  key={exercise.id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-medium">#{index + 1}</span>
                      <h3 className="font-semibold">{exercise.exerciseName}</h3>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded capitalize">
                        {exercise.exerciseType}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {exercise.exerciseType === 'strength' && (
                        <div className="flex gap-4">
                          {exercise.sets && <span>{exercise.sets} sets</span>}
                          {exercise.reps && <span>{exercise.reps} reps</span>}
                          {exercise.weight && <span>{exercise.weight} kg</span>}
                          {exercise.restTime && <span>{exercise.restTime}s rest</span>}
                        </div>
                      )}
                      {exercise.exerciseType === 'cardio' && (
                        <div className="flex gap-4">
                          {exercise.duration && <span>{exercise.duration} min</span>}
                          {exercise.distance && <span>{exercise.distance} km</span>}
                        </div>
                      )}
                      {exercise.exerciseType === 'flexibility' && exercise.duration && (
                        <span>{exercise.duration} minutes</span>
                      )}
                    </div>
                    {exercise.notes && (
                      <p className="mt-2 text-sm text-gray-500 italic">{exercise.notes}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteExercise(exercise.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}