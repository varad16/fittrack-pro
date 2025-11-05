// ============================================
// 📂 FILE PATH: app/(dashboard)/ai-workout-plan/page.tsx
// ============================================
// PURPOSE: AI Workout Plan Generator Page
// URL: /ai-workout-plan
// ============================================

'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

interface WorkoutPlan {
  workoutPlan: {
    name: string
    description: string
    totalDuration: number
    difficulty: string
    equipment: string[]
    warmUp: {
      duration: number
      exercises: Array<{
        name: string
        duration: string
        instructions: string
      }>
    }
    mainWorkout: {
      exercises: Array<{
        name: string
        targetMuscles: string[]
        sets: number
        reps: string
        restTime: string
        instructions: string
        formTips: string[]
        modifications: {
          easier: string
          harder: string
        }
      }>
    }
    coolDown: {
      duration: number
      exercises: Array<{
        name: string
        duration: string
        instructions: string
      }>
    }
    tips: string[]
    estimatedCaloriesBurn: number
  }
}

export default function AIWorkoutPlanPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null)
  const [settings, setSettings] = useState({
    goal: 'general_fitness',
    fitnessLevel: 'beginner',
    equipment: 'bodyweight',
    duration: 30,
    workoutType: 'full_body',
  })

  const generateWorkoutPlan = async () => {
    setLoading(true)
    console.log('🚀 Starting workout plan generation...')
    
    try {
      const res = await fetch('/api/ai/workout-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error)
      }

      console.log('✅ Workout plan received:', data.workoutPlan)
      setWorkoutPlan(data.workoutPlan)
      toast.success('Workout plan generated successfully!')
    } catch (error: any) {
      console.error('❌ Error generating workout plan:', error)
      toast.error(error.message || 'Failed to generate workout plan')
    } finally {
      setLoading(false)
    }
  }

  const getMuscleEmoji = (muscle: string) => {
    const emojis: Record<string, string> = {
      chest: '💪',
      back: '🏋️',
      legs: '🦵',
      arms: '💪',
      shoulders: '🤸',
      core: '🧘',
      cardio: '❤️',
    }
    return emojis[muscle.toLowerCase()] || '💪'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">💪 AI Workout Plan Generator</h1>
          <p className="mt-2 text-gray-600">
            Generate personalized workout plans based on your fitness goals
          </p>
        </div>

        {!workoutPlan ? (
          /* Generation Form */
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Customize Your Workout
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Goal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fitness Goal
                </label>
                <select
                  value={settings.goal}
                  onChange={(e) => setSettings({ ...settings, goal: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="general_fitness">General Fitness</option>
                  <option value="muscle_gain">Muscle Gain</option>
                  <option value="weight_loss">Weight Loss</option>
                  <option value="strength">Strength Building</option>
                  <option value="endurance">Endurance</option>
                </select>
              </div>

              {/* Fitness Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fitness Level
                </label>
                <select
                  value={settings.fitnessLevel}
                  onChange={(e) => setSettings({ ...settings, fitnessLevel: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              {/* Equipment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipment Available
                </label>
                <select
                  value={settings.equipment}
                  onChange={(e) => setSettings({ ...settings, equipment: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="bodyweight">Bodyweight Only</option>
                  <option value="home">Home Equipment</option>
                  <option value="gym">Full Gym Access</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration: {settings.duration} minutes
                </label>
                <input
                  type="range"
                  min="15"
                  max="90"
                  step="15"
                  value={settings.duration}
                  onChange={(e) => setSettings({ ...settings, duration: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>15 min</span>
                  <span>30 min</span>
                  <span>45 min</span>
                  <span>60 min</span>
                  <span>90 min</span>
                </div>
              </div>

              {/* Workout Type */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workout Type
                </label>
                <select
                  value={settings.workoutType}
                  onChange={(e) => setSettings({ ...settings, workoutType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="full_body">Full Body</option>
                  <option value="strength">Strength Training</option>
                  <option value="cardio">Cardio</option>
                  <option value="hiit">HIIT</option>
                  <option value="flexibility">Flexibility/Yoga</option>
                </select>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                ℹ️ Your Workout Plan
              </h3>
              <p className="text-sm text-blue-700">
                AI will create a personalized workout matching your goals, fitness level, and available equipment.
                Each workout includes warm-up, main exercises, and cool-down with detailed instructions.
              </p>
            </div>

            <button
              onClick={generateWorkoutPlan}
              disabled={loading}
              className="w-full mt-6 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating with AI...
                </span>
              ) : (
                '💪 Generate AI Workout Plan'
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-3">
              Powered by OpenAI GPT-4o mini
            </p>
          </div>
        ) : (
          /* Workout Plan Display - Continue in next part due to length... */
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow p-6 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{workoutPlan.workoutPlan.name}</h2>
                  <p className="text-gray-600 mt-1">{workoutPlan.workoutPlan.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-purple-600">{workoutPlan.workoutPlan.totalDuration}</div>
                  <div className="text-sm text-gray-600">minutes</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-sm text-gray-600">Difficulty</div>
                  <div className="font-semibold text-gray-900 capitalize">{workoutPlan.workoutPlan.difficulty}</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-sm text-gray-600">Equipment</div>
                  <div className="font-semibold text-gray-900 capitalize">{workoutPlan.workoutPlan.equipment.join(', ')}</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-sm text-gray-600">Est. Calories</div>
                  <div className="font-semibold text-gray-900">{workoutPlan.workoutPlan.estimatedCaloriesBurn}</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-sm text-gray-600">Exercises</div>
                  <div className="font-semibold text-gray-900">{workoutPlan.workoutPlan.mainWorkout.exercises.length}</div>
                </div>
              </div>
            </div>

            {/* Tips */}
            {workoutPlan.workoutPlan.tips && workoutPlan.workoutPlan.tips.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3">
                  💡 Pro Tips
                </h3>
                <ul className="space-y-2">
                  {workoutPlan.workoutPlan.tips.map((tip, idx) => (
                    <li key={idx} className="text-sm text-yellow-800 flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warm-up */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🔥 Warm-Up ({workoutPlan.workoutPlan.warmUp.duration} min)
              </h3>
              <div className="space-y-3">
                {workoutPlan.workoutPlan.warmUp.exercises.map((exercise, idx) => (
                  <div key={idx} className="p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{exercise.name}</h4>
                      <span className="text-sm text-orange-600 font-medium">{exercise.duration}</span>
                    </div>
                    <p className="text-sm text-gray-700">{exercise.instructions}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Workout */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                💪 Main Workout
              </h3>
              <div className="space-y-4">
                {workoutPlan.workoutPlan.mainWorkout.exercises.map((exercise, idx) => (
                  <div key={idx} className="p-6 bg-gray-50 rounded-lg border-l-4 border-emerald-500">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{exercise.name}</h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {exercise.targetMuscles.map((muscle, mIdx) => (
                            <span key={mIdx} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                              {getMuscleEmoji(muscle)} {muscle}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Sets × Reps</div>
                        <div className="font-bold text-emerald-600">{exercise.sets} × {exercise.reps}</div>
                        <div className="text-xs text-gray-500 mt-1">Rest: {exercise.restTime}</div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-3">{exercise.instructions}</p>

                    {/* Form Tips */}
                    <div className="mb-3">
                      <h5 className="text-xs font-semibold text-gray-900 mb-1">Form Tips:</h5>
                      <ul className="space-y-1">
                        {exercise.formTips.map((tip, tIdx) => (
                          <li key={tIdx} className="text-xs text-gray-600 flex items-start gap-1">
                            <span className="text-emerald-500">✓</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Modifications */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 p-2 rounded">
                        <div className="text-xs font-semibold text-blue-900 mb-1">Easier:</div>
                        <div className="text-xs text-blue-700">{exercise.modifications.easier}</div>
                      </div>
                      <div className="bg-purple-50 p-2 rounded">
                        <div className="text-xs font-semibold text-purple-900 mb-1">Harder:</div>
                        <div className="text-xs text-purple-700">{exercise.modifications.harder}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cool-down */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🧘 Cool-Down ({workoutPlan.workoutPlan.coolDown.duration} min)
              </h3>
              <div className="space-y-3">
                {workoutPlan.workoutPlan.coolDown.exercises.map((exercise, idx) => (
                  <div key={idx} className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{exercise.name}</h4>
                      <span className="text-sm text-blue-600 font-medium">{exercise.duration}</span>
                    </div>
                    <p className="text-sm text-gray-700">{exercise.instructions}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setWorkoutPlan(null)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Generate New Workout
              </button>
              <button
                onClick={() => toast.success('Save feature coming soon!')}
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                💾 Save Workout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
