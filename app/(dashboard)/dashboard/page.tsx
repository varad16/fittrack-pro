import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Flame, Target, TrendingUp, Activity, Sparkles, Dumbbell, ArrowRight, MessageCircle, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

// Helper function to get today's date range
function getTodayRange() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return { today, tomorrow }
}

// Helper function to get this week's date range
function getWeekRange() {
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay()) // Sunday
  startOfWeek.setHours(0, 0, 0, 0)
  return startOfWeek
}

async function getDashboardData(userId: string) {
  const startOfWeek = getWeekRange()

  // Get ALL meals from user and filter in JavaScript
  const allMeals = await prisma.meal.findMany({
    where: {
      userId,
    },
    include: {
      foodEntries: true,
    },
    orderBy: {
      date: 'desc',
    },
  })

  // Get today's date string (YYYY-MM-DD)
  const todayDateString = new Date().toISOString().split('T')[0]
  
  console.log('🔍 Today date string:', todayDateString)
  console.log('📊 All meals:', allMeals.length)
  
  // Filter meals for today (compare date strings)
  const todayMeals = allMeals.filter(meal => {
    const mealDateString = meal.date.toISOString().split('T')[0]
    console.log('  Meal date:', mealDateString, 'Match:', mealDateString === todayDateString)
    return mealDateString === todayDateString
  })

  console.log('📊 Today meals found:', todayMeals.length)

  // Calculate totals from food entries (same as before)
  const todayTotals = todayMeals.reduce((acc, meal) => {
    const mealTotals = meal.foodEntries.reduce(
      (mealAcc, food) => ({
        calories: mealAcc.calories + (food.calories * food.quantity),
        protein: mealAcc.protein + (food.protein * food.quantity),
        carbs: mealAcc.carbs + (food.carbs * food.quantity),
        fats: mealAcc.fats + (food.fats * food.quantity),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    )

    return {
      calories: acc.calories + mealTotals.calories,
      protein: acc.protein + mealTotals.protein,
      carbs: acc.carbs + mealTotals.carbs,
      fats: acc.fats + mealTotals.fats,
    }
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 })

  console.log('📊 Today totals:', todayTotals)

  // Rest of your code stays the same...
  // Get latest weight from WeightLog
  const latestWeight = await prisma.weightLog.findFirst({
    where: { userId },
    orderBy: { date: 'desc' },
  })

  // Get weight from 30 days ago for comparison
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const oldWeight = await prisma.weightLog.findFirst({
    where: {
      userId,
      date: { lte: thirtyDaysAgo },
    },
    orderBy: { date: 'desc' },
  })

  const weightChange = latestWeight && oldWeight 
    ? latestWeight.weight - oldWeight.weight 
    : 0

  // Get this week's workouts
  const weekWorkouts = await prisma.workout.count({
    where: {
      userId,
      date: {
        gte: startOfWeek,
      },
    },
  })

  // Get user's goals
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      calorieGoal: true,
      proteinGoal: true,
    },
  })

  return {
    todayTotals,
    latestWeight: latestWeight?.weight || null,
    weightChange,
    weekWorkouts,
    calorieGoal: user?.calorieGoal || 2000,
    proteinGoal: user?.proteinGoal || 400,
  }
}


export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    redirect('/login')
  }

  const data = await getDashboardData(user.id)

  // Calculate percentages for progress bars
  const caloriePercent = Math.min(100, (data.todayTotals.calories / data.calorieGoal) * 100)
  const proteinPercent = Math.min(100, (data.todayTotals.protein / data.proteinGoal) * 100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Track your fitness journey</p>
      </div>

      {/* Stats Grid - NOW MATCHES NUTRITION PAGE! */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Calories Today
            </CardTitle>
            <Flame className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(data.todayTotals.calories)}
            </div>
            <p className="text-xs text-gray-600">
              Goal: {data.calorieGoal} kcal
            </p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all" 
                style={{ width: `${caloriePercent}%` }}
              />
            </div>
            {data.todayTotals.calories === 0 && (
              <Link href="/nutrition" className="text-xs text-blue-600 hover:underline mt-2 block">
                Log your first meal →
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Protein
            </CardTitle>
            <Target className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(data.todayTotals.protein)}g
            </div>
            <p className="text-xs text-gray-600">
              Goal: {data.proteinGoal}g
            </p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all" 
                style={{ width: `${proteinPercent}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Weight
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.latestWeight ? `${data.latestWeight.toFixed(1)} kg` : 'Not set'}
            </div>
            {data.weightChange !== 0 && (
              <p className={`text-xs ${data.weightChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.weightChange > 0 ? '+' : ''}{data.weightChange.toFixed(1)} kg this month
              </p>
            )}
            {!data.latestWeight && (
              <Link href="/progress" className="text-xs text-blue-600 hover:underline mt-2 block">
                Log your weight →
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Workouts
            </CardTitle>
            <Activity className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.weekWorkouts}</div>
            <p className="text-xs text-gray-600">This week</p>
            {data.weekWorkouts === 0 && (
              <Link href="/workouts" className="text-xs text-blue-600 hover:underline mt-2 block">
                Start your first workout →
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Meal Plan Card */}
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/30 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">AI Meal Planner</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full font-semibold">
                    AI
                  </span>
                  <span className="text-xs text-emerald-700 font-medium">
                    Nutrition Plans
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <p className="text-gray-700 mb-4 text-sm">
              Generate personalized meal plans with recipes, macros, and cooking instructions tailored to your goals.
            </p>
            <Link href="/ai-meal-plan">
              <Button className="bg-emerald-600 hover:bg-emerald-700 w-full">
                Generate Meal Plan
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* AI Workout Plan Card */}
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">AI Workout Planner</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full font-semibold">
                    NEW
                  </span>
                  <span className="text-xs text-purple-700 font-medium">
                    Fitness Plans
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <p className="text-gray-700 mb-4 text-sm">
              Create personalized workout plans with exercises, sets, reps, and form tips based on your fitness level.
            </p>
            <Link href="/ai-workout-plan">
              <Button className="bg-purple-600 hover:bg-purple-700 w-full">
                Generate Workout Plan
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* AI Coach Card */}
<Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 overflow-hidden relative">
  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full -mr-16 -mt-16"></div>
  <CardHeader className="relative z-10">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
        <MessageCircle className="w-6 h-6 text-white" />
      </div>
      <div>
        <CardTitle className="text-xl">AI Coach</CardTitle>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">
            AI
          </span>
          <span className="text-xs text-blue-700 font-medium">
            Chat Assistant
          </span>
        </div>
      </div>
    </div>
  </CardHeader>
  <CardContent className="relative z-10">
    <p className="text-gray-700 mb-4 text-sm">
      Chat with your personal AI fitness coach for advice, motivation, and progress tracking.
    </p>
    <Link href="/ai-coach">
      <Button className="bg-blue-600 hover:bg-blue-700 w-full">
        Chat with AI Coach
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </Link>
  </CardContent>
</Card>

{/* Progress Charts Card */}
<Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 overflow-hidden relative">
  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/30 rounded-full -mr-16 -mt-16"></div>
  <CardHeader className="relative z-10">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
        <BarChart3 className="w-6 h-6 text-white" />
      </div>
      <div>
        <CardTitle className="text-xl">Progress Charts</CardTitle>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs bg-orange-600 text-white px-2 py-0.5 rounded-full font-semibold">
            NEW
          </span>
          <span className="text-xs text-orange-700 font-medium">
            Visual Analytics
          </span>
        </div>
      </div>
    </div>
  </CardHeader>
  <CardContent className="relative z-10">
    <p className="text-gray-700 mb-4 text-sm">
      Visualize your fitness journey with interactive charts and progress tracking.
    </p>
    <Link href="/progress-charts">
      <Button className="bg-orange-600 hover:bg-orange-700 w-full">
        View Progress Charts
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </Link>
  </CardContent>
</Card>

      </div>



      {/* Quick Actions */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Link href="/nutrition">
            <Button>Log Meal</Button>
          </Link>
          <Link href="/workouts">
            <Button variant="outline">Start Workout</Button>
          </Link>
          <Link href="/activities">
            <Button variant="outline">Track Activity</Button>
          </Link>
        </CardContent>
      </Card> */}
    </div>
  )
}
