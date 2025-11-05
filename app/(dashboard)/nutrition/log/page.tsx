'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Search } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface NutritionixFood {
  food_name: string
  brand_name?: string
  serving_qty: number
  serving_unit: string
  nf_calories: number
  nf_protein: number
  nf_total_carbohydrate: number
  nf_total_fat: number
  nf_dietary_fiber?: number
  nf_sugars?: number
  nf_sodium?: number
  photo?: {
    thumb?: string
  }
}

function LogFoodContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mealId = searchParams.get('mealId')

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<NutritionixFood[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedFood, setSelectedFood] = useState<NutritionixFood | null>(null)
  const [quantity, setQuantity] = useState(1)

  const searchFoods = async () => {
    if (!searchQuery.trim()) return

    try {
      setLoading(true)
      const res = await fetch(`/api/nutrition/search?query=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()

      if (res.ok) {
        setSearchResults(data.common || [])
      } else {
        toast.error('Failed to search foods')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const addFood = async () => {
    if (!selectedFood || !mealId) return

    try {
      const res = await fetch(`/api/meals/${mealId}/food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodName: selectedFood.food_name,
          brand: selectedFood.brand_name,
          servingSize: `${selectedFood.serving_qty}`,
          servingUnit: selectedFood.serving_unit,
          quantity,
          calories: selectedFood.nf_calories,
          protein: selectedFood.nf_protein,
          carbs: selectedFood.nf_total_carbohydrate,
          fats: selectedFood.nf_total_fat,
          fiber: selectedFood.nf_dietary_fiber,
          sugar: selectedFood.nf_sugars,
          sodium: selectedFood.nf_sodium,
        }),
      })

      if (res.ok) {
        toast.success('Food added!')
        router.push('/nutrition')
      } else {
        toast.error('Failed to add food')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/nutrition">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add Food</h1>
          <p className="text-gray-600 mt-1">Search and log your food</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Foods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search for food (e.g., chicken breast, apple)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchFoods()}
            />
            <Button onClick={searchFoods} disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {searchResults.map((food, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedFood(food)}
                  className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    selectedFood === food ? 'border-green-500 bg-green-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium capitalize">{food.food_name}</p>
                      {food.brand_name && (
                        <p className="text-sm text-gray-600">{food.brand_name}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        {food.serving_qty} {food.serving_unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{Math.round(food.nf_calories)} cal</p>
                      <p className="text-sm text-gray-600">
                        P: {Math.round(food.nf_protein)}g | 
                        C: {Math.round(food.nf_total_carbohydrate)}g | 
                        F: {Math.round(food.nf_total_fat)}g
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Food */}
      {selectedFood && (
        <Card>
          <CardHeader>
            <CardTitle>Add to Meal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-lg capitalize">{selectedFood.food_name}</p>
                {selectedFood.brand_name && (
                  <p className="text-gray-600">{selectedFood.brand_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Quantity (servings)</label>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                />
                <p className="text-sm text-gray-600 mt-1">
                  1 serving = {selectedFood.serving_qty} {selectedFood.serving_unit}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium mb-2">Nutrition (for {quantity} serving{quantity !== 1 ? 's' : ''})</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Calories: {Math.round(selectedFood.nf_calories * quantity)} kcal</div>
                  <div>Protein: {Math.round(selectedFood.nf_protein * quantity)}g</div>
                  <div>Carbs: {Math.round(selectedFood.nf_total_carbohydrate * quantity)}g</div>
                  <div>Fat: {Math.round(selectedFood.nf_total_fat * quantity)}g</div>
                </div>
              </div>

              <Button onClick={addFood} className="w-full">
                Add to Meal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function LogFoodPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LogFoodContent />
    </Suspense>
  )
}