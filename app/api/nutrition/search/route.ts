import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('query')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    if (!process.env.USDA_API_KEY) {
      console.error('Missing USDA API key')
      return NextResponse.json(
        { error: 'USDA API not configured' },
        { status: 500 }
      )
    }

    // Call USDA FoodData Central API
    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=10&api_key=${process.env.USDA_API_KEY}`
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('USDA API error:', errorText)
      throw new Error(`USDA API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Transform USDA format to match our frontend
    const transformedFoods = data.foods?.slice(0, 10).map((food: any) => {
      const nutrients = food.foodNutrients || []
      
      const getNutrient = (name: string) => {
        const nutrient = nutrients.find((n: any) => 
          n.nutrientName?.toLowerCase().includes(name.toLowerCase())
        )
        return nutrient?.value || 0
      }

      return {
        food_name: food.description || food.lowercaseDescription || 'Unknown',
        brand_name: food.brandOwner,
        serving_qty: 100,
        serving_unit: 'g',
        nf_calories: getNutrient('energy'),
        nf_protein: getNutrient('protein'),
        nf_total_carbohydrate: getNutrient('carbohydrate'),
        nf_total_fat: getNutrient('fat'),
        nf_dietary_fiber: getNutrient('fiber'),
        nf_sugars: getNutrient('sugars'),
        nf_sodium: getNutrient('sodium'),
      }
    }) || []

    return NextResponse.json({ common: transformedFoods })
  } catch (error) {
    console.error('Error searching food:', error)
    return NextResponse.json(
      { error: 'Failed to search foods' },
      { status: 500 }
    )
  }
}