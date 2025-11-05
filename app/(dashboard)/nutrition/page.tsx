'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface FoodEntry {
  id: string
  foodName: string
  brand?: string
  servingSize: string
  quantity: number
  calories: number
  protein: number
  carbs: number
  fats: number
}

interface Meal {
  id: string
  mealType: string
  date: Date
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFats: number
  foodEntries: FoodEntry[]
}

export default function NutritionPage() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack']

  useEffect(() => {
    fetchMeals()
  }, [selectedDate])

  const fetchMeals = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/meals?date=${selectedDate}`)
      const data = await res.json()
      
      if (res.ok) {
        setMeals(data.meals)
      } else {
        toast.error('Failed to fetch meals')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const createMeal = async (mealType: string) => {
    try {
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealType, date: selectedDate }),
      })

      if (res.ok) {
        toast.success('Meal created!')
        fetchMeals()
      } else {
        toast.error('Failed to create meal')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const deleteFoodEntry = async (mealId: string, foodEntryId: string) => {
    try {
      const res = await fetch(`/api/meals/${mealId}/food?foodEntryId=${foodEntryId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Food removed!')
        fetchMeals()
      } else {
        toast.error('Failed to remove food')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const getMealByType = (type: string) => {
    return meals.find(m => m.mealType === type)
  }

  const totals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.totalCalories,
      protein: acc.protein + meal.totalProtein,
      carbs: acc.carbs + meal.totalCarbs,
      fats: acc.fats + meal.totalFats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nutrition</h1>
          <p className="text-gray-600 mt-1">Track your daily food intake</p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Daily Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Calories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(totals.calories)}</div>
            <p className="text-xs text-gray-600">kcal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Protein</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(totals.protein)}</div>
            <p className="text-xs text-gray-600">grams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Carbs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(totals.carbs)}</div>
            <p className="text-xs text-gray-600">grams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Fats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(totals.fats)}</div>
            <p className="text-xs text-gray-600">grams</p>
          </CardContent>
        </Card>
      </div>

      {/* Meals */}
      <div className="space-y-4">
        {mealTypes.map((type) => {
          const meal = getMealByType(type)
          
          return (
            <Card key={type}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="capitalize">{type}</CardTitle>
                  {meal ? (
                    <Link href={`/nutrition/log?mealId=${meal.id}`}>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Food
                      </Button>
                    </Link>
                  ) : (
                    <Button size="sm" onClick={() => createMeal(type)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create {type}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {meal && meal.foodEntries.length > 0 ? (
                  <div className="space-y-2">
                    {meal.foodEntries.map((food) => (
                      <div
                        key={food.id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{food.foodName}</p>
                          {food.brand && (
                            <p className="text-sm text-gray-600">{food.brand}</p>
                          )}
                          <p className="text-sm text-gray-600">
                            {food.quantity} × {food.servingSize}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{Math.round(food.calories * food.quantity)} cal</p>
                          <p className="text-sm text-gray-600">
                            P: {Math.round(food.protein * food.quantity)}g | 
                            C: {Math.round(food.carbs * food.quantity)}g | 
                            F: {Math.round(food.fats * food.quantity)}g
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteFoodEntry(meal.id, food.id)}
                          className="ml-4"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <div className="pt-2 border-t">
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>{Math.round(meal.totalCalories)} cal</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    {meal ? 'No food entries yet' : 'Click "Create" to start logging'}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}