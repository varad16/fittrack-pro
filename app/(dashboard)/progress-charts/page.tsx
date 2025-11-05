// ============================================
// 📂 FILE PATH: app/(dashboard)/progress-charts/page.tsx
// ============================================
// PURPOSE: Advanced Progress Charts
// NOTE: Install recharts first: npm install recharts
// ============================================

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingDown, TrendingUp, Target, Activity, Calendar } from 'lucide-react'

interface ChartData {
  weightData: Array<{ date: string; weight: number }>
  nutritionData: Array<{ date: string; calories: number; protein: number; carbs: number; fats: number }>
  workoutData: Array<{ week: string; count: number }>
  goals: {
    calorieGoal: number
    proteinGoal: number
    goalWeight: number | null
  }
}

export default function ProgressChartsPage() {
  const [data, setData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState(30) // days

  useEffect(() => {
    fetchChartData()
  }, [timeRange])

  const fetchChartData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/charts/progress?days=${timeRange}`)
      const chartData = await res.json()
      setData(chartData)
    } catch (error) {
      console.error('Failed to fetch chart data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  // Calculate stats
  const weightChange = data.weightData.length >= 2
    ? data.weightData[data.weightData.length - 1].weight - data.weightData[0].weight
    : 0

  const avgCalories = data.nutritionData.length > 0
    ? data.nutritionData.reduce((sum, d) => sum + d.calories, 0) / data.nutritionData.length
    : 0

  const totalWorkouts = data.workoutData.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Progress Charts</h1>
          <p className="text-gray-600 mt-1">Visualize your fitness journey</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <Button
              key={days}
              onClick={() => setTimeRange(days)}
              variant={timeRange === days ? 'default' : 'outline'}
              size="sm"
            >
              {days} Days
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Weight Change
            </CardTitle>
            {weightChange < 0 ? (
              <TrendingDown className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingUp className="w-4 h-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${weightChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
              {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
            </div>
            <p className="text-xs text-gray-600 mt-1">Last {timeRange} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg. Daily Calories
            </CardTitle>
            <Target className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(avgCalories)}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Goal: {data.goals.calorieGoal} kcal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Workouts
            </CardTitle>
            <Activity className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {totalWorkouts}
            </div>
            <p className="text-xs text-gray-600 mt-1">Last {timeRange} days</p>
          </CardContent>
        </Card>
      </div>

      {/* Weight Progress Chart */}
      {data.weightData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Weight Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.weightData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  stroke="#666"
                />
                <YAxis stroke="#666" domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Weight']}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                {data.goals.goalWeight && (
                  <Line
                    type="monotone"
                    dataKey={() => data.goals.goalWeight}
                    stroke="#22c55e"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                    name="Goal"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Calorie & Protein Chart */}
      {data.nutritionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Nutrition</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.nutritionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  stroke="#666"
                />
                <YAxis stroke="#666" />
                <Tooltip
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value: number) => [Math.round(value), '']}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="calories"
                  stackId="1"
                  stroke="#f97316"
                  fill="#fed7aa"
                  name="Calories"
                />
                <Area
                  type="monotone"
                  dataKey="protein"
                  stackId="2"
                  stroke="#3b82f6"
                  fill="#bfdbfe"
                  name="Protein (g)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Macros Breakdown Chart */}
      {data.nutritionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Macronutrient Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.nutritionData.slice(-7)}> {/* Last 7 days */}
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                  stroke="#666"
                />
                <YAxis stroke="#666" />
                <Tooltip
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value: number) => [Math.round(value) + 'g', '']}
                />
                <Legend />
                <Bar dataKey="protein" fill="#3b82f6" name="Protein" />
                <Bar dataKey="carbs" fill="#f59e0b" name="Carbs" />
                <Bar dataKey="fats" fill="#ef4444" name="Fats" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Workout Frequency */}
      {data.workoutData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Workout Frequency</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.workoutData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="week"
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  stroke="#666"
                />
                <YAxis stroke="#666" />
                <Tooltip
                  labelFormatter={(date) => `Week of ${new Date(date).toLocaleDateString()}`}
                  formatter={(value: number) => [`${value} workouts`, '']}
                />
                <Bar dataKey="count" fill="#8b5cf6" name="Workouts" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {data.weightData.length === 0 && data.nutritionData.length === 0 && data.workoutData.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Yet</h3>
            <p className="text-gray-600 text-center max-w-md">
              Start logging your meals, workouts, and weight to see your progress visualized here!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

