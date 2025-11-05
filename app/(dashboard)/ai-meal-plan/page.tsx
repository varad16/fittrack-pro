'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface MealPlan {
  mealPlan: {
    day: number
    date: string
    meals: Array<{
      mealType: string
      name: string
      description: string
      foods: Array<{
        item: string
        quantity: string
        calories: number
        protein: number
        carbs: number
        fats: number
      }>
      totalCalories: number
      totalProtein: number
      totalCarbs: number
      totalFats: number
      prepTime: string
      instructions: string
    }>
    dailyTotals: {
      calories: number
      protein: number
      carbs: number
      fats: number
    }
  }[]
  weeklyTips: string[]
}

export default function AIMealPlanPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)
  const [selectedDay, setSelectedDay] = useState(0)
  const [settings, setSettings] = useState({
    daysCount: 7,
    allergies: [] as string[],
  })

  const generateMealPlan = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.needsSetup) {
          toast.error(data.error)
          setTimeout(() => router.push('/settings'), 2000)
          return
        }
        throw new Error(data.error)
      }

      setMealPlan(data.mealPlan)
      toast.success('Meal plan generated successfully!')
    } catch (error: any) {
      console.error('Error generating meal plan:', error)
      toast.error(error.message || 'Failed to generate meal plan')
    } finally {
      setLoading(false)
    }
  }

  const getMealTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      breakfast: '🌅',
      lunch: '☀️',
      dinner: '🌙',
      snack: '🍎',
    }
    return icons[type] || '🍽️'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Meal Plan Generator</h1>
          <p className="mt-2 text-gray-600">
            Generate personalized meal plans based on your nutrition goals
          </p>
        </div>

        {!mealPlan ? (
          /* Generation Form */
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Customize Your Meal Plan
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Days
                </label>
                <select
                  value={settings.daysCount}
                  onChange={(e) => setSettings({ ...settings, daysCount: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value={3}>3 Days</option>
                  <option value={5}>5 Days</option>
                  <option value={7}>7 Days (1 Week)</option>
                  <option value={14}>14 Days (2 Weeks)</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">
                  ℹ️ Your Nutrition Goals
                </h3>
                <p className="text-sm text-blue-700">
                  The meal plan will be based on your nutrition goals set in Settings.
                  Make sure you've set your daily calorie and macro targets!
                </p>
              </div>

              <button
                onClick={generateMealPlan}
                disabled={loading}
                className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
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
                  '✨ Generate AI Meal Plan'
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Powered by OpenAI GPT-4o mini
              </p>
            </div>
          </div>
        ) : (
          /* Meal Plan Display */
          <div className="space-y-6">
            {/* Weekly Tips */}
            {mealPlan.weeklyTips && mealPlan.weeklyTips.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-emerald-900 mb-3">
                  💡 Weekly Tips
                </h3>
                <ul className="space-y-2">
                  {mealPlan.weeklyTips.map((tip, idx) => (
                    <li key={idx} className="text-sm text-emerald-700 flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Day Selector */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {mealPlan.mealPlan.map((day, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedDay(idx)}
                    className={`
                      px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors
                      ${selectedDay === idx
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    Day {day.day}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Day Meals */}
            {mealPlan.mealPlan[selectedDay] && (
              <div className="space-y-4">
                {/* Daily Totals */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Daily Totals - Day {mealPlan.mealPlan[selectedDay].day}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-600">
                        {Math.round(mealPlan.mealPlan[selectedDay].dailyTotals.calories)}
                      </p>
                      <p className="text-sm text-gray-600">Calories</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {Math.round(mealPlan.mealPlan[selectedDay].dailyTotals.protein)}g
                      </p>
                      <p className="text-sm text-gray-600">Protein</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {Math.round(mealPlan.mealPlan[selectedDay].dailyTotals.carbs)}g
                      </p>
                      <p className="text-sm text-gray-600">Carbs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">
                        {Math.round(mealPlan.mealPlan[selectedDay].dailyTotals.fats)}g
                      </p>
                      <p className="text-sm text-gray-600">Fats</p>
                    </div>
                  </div>
                </div>

                {/* Meals */}
                {mealPlan.mealPlan[selectedDay].meals.map((meal, idx) => (
                  <div key={idx} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{getMealTypeIcon(meal.mealType)}</span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 capitalize">
                            {meal.mealType}
                          </h3>
                          <p className="text-emerald-600 font-medium">{meal.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Prep time</p>
                        <p className="font-medium text-gray-900">{meal.prepTime}</p>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4">{meal.description}</p>

                    {/* Macros */}
                    <div className="grid grid-cols-4 gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-900">
                          {Math.round(meal.totalCalories)}
                        </p>
                        <p className="text-xs text-gray-600">kcal</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-900">
                          {Math.round(meal.totalProtein)}g
                        </p>
                        <p className="text-xs text-gray-600">protein</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-900">
                          {Math.round(meal.totalCarbs)}g
                        </p>
                        <p className="text-xs text-gray-600">carbs</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-900">
                          {Math.round(meal.totalFats)}g
                        </p>
                        <p className="text-xs text-gray-600">fats</p>
                      </div>
                    </div>

                    {/* Foods */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Ingredients:</h4>
                      <ul className="space-y-1">
                        {meal.foods.map((food, foodIdx) => (
                          <li key={foodIdx} className="text-sm text-gray-700 flex items-center gap-2">
                            <span className="text-emerald-500">•</span>
                            <span>{food.item} - {food.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Instructions */}
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Instructions:</h4>
                      <p className="text-sm text-gray-700">{meal.instructions}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setMealPlan(null)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Generate New Plan
              </button>
              <button
                onClick={() => {
                  // TODO: Implement save/export functionality
                  toast.success('Export feature coming soon!')
                }}
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                📥 Export Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}