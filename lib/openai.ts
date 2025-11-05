// ============================================
// 📂 FILE PATH: lib/openai.ts
// ============================================
// PURPOSE: OpenAI API wrapper for nutrition AND workout features
// ============================================

import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Use GPT-4o-mini for cost efficiency (recommended for your $5 budget)
export const AI_MODEL = 'gpt-4o-mini'

// Alternative: Use GPT-4o for higher quality (more expensive)
// export const AI_MODEL = 'gpt-4o'

// ============================================
// MEAL PLAN FUNCTIONS (Already working!)
// ============================================

// Helper function to generate meal plans
export async function generateMealPlan(params: {
  calorieGoal: number
  proteinGoal: number
  carbGoal: number
  fatGoal: number
  dietaryPreference?: string
  allergies?: string[]
  daysCount?: number
}) {
  const {
    calorieGoal,
    proteinGoal,
    carbGoal,
    fatGoal,
    dietaryPreference = 'omnivore',
    allergies = [],
    daysCount = 7,
  } = params

  const systemPrompt = `You are a professional nutritionist and meal planning expert. 
Generate personalized meal plans that are realistic, delicious, and meet specific nutritional goals.
Always return valid JSON in the exact format specified.`

  const userPrompt = `Create a ${daysCount}-day meal plan with the following requirements:

NUTRITIONAL GOALS (Daily):
- Calories: ${calorieGoal} kcal
- Protein: ${proteinGoal}g
- Carbohydrates: ${carbGoal}g
- Fat: ${fatGoal}g

DIETARY PREFERENCES:
- Diet type: ${dietaryPreference}
${allergies.length > 0 ? `- Allergies/Restrictions: ${allergies.join(', ')}` : ''}

REQUIREMENTS:
1. Each day should have breakfast, lunch, dinner, and 2 snacks
2. Meals should be realistic and easy to prepare
3. Include portion sizes
4. Each meal should list approximate macros
5. Total daily macros should be close to targets (within 10%)
6. Variety across days - no repeated meals

Return ONLY a JSON object in this exact format:
{
  "mealPlan": [
    {
      "day": 1,
      "date": "2024-01-01",
      "meals": [
        {
          "mealType": "breakfast",
          "name": "Meal name",
          "description": "Brief description",
          "foods": [
            {
              "item": "Food item",
              "quantity": "Amount",
              "calories": 0,
              "protein": 0,
              "carbs": 0,
              "fats": 0
            }
          ],
          "totalCalories": 0,
          "totalProtein": 0,
          "totalCarbs": 0,
          "totalFats": 0,
          "prepTime": "15 min",
          "instructions": "Simple cooking instructions"
        }
      ],
      "dailyTotals": {
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fats": 0
      }
    }
  ],
  "weeklyTips": [
    "Helpful tip 1",
    "Helpful tip 2",
    "Helpful tip 3"
  ]
}`

  try {
    console.log('Calling OpenAI API...')
    
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    console.log('OpenAI response received')
    
    const content = completion.choices[0]?.message?.content || '{}'
    console.log('Parsing JSON response...')
    
    const parsedData = JSON.parse(content)
    console.log('Meal plan generated successfully')
    
    return parsedData
  } catch (error) {
    console.error('OpenAI API Error:', error)
    throw new Error('Failed to generate meal plan')
  }
}

// Helper function for meal recommendations
export async function getMealRecommendation(params: {
  mealType: string
  remainingCalories: number
  remainingProtein: number
  remainingCarbs: number
  remainingFats: number
  dietaryPreference?: string
  previousMealsToday?: string[]
}) {
  const {
    mealType,
    remainingCalories,
    remainingProtein,
    remainingCarbs,
    remainingFats,
    dietaryPreference = 'omnivore',
    previousMealsToday = [],
  } = params

  const systemPrompt = `You are a nutrition expert providing meal recommendations.
Suggest realistic meals that help users meet their remaining nutritional goals.
Always return valid JSON.`

  const userPrompt = `Recommend a ${mealType} meal with these requirements:

REMAINING DAILY GOALS:
- Calories: ${remainingCalories} kcal
- Protein: ${remainingProtein}g
- Carbs: ${remainingCarbs}g
- Fat: ${remainingFats}g

PREFERENCES:
- Diet type: ${dietaryPreference}
${previousMealsToday.length > 0 ? `- Already eaten today: ${previousMealsToday.join(', ')}` : ''}

Provide 3 meal options that:
1. Fit within the remaining macros
2. Are realistic and easy to make
3. Don't repeat previous meals today
4. Are appropriate for ${mealType}

Return ONLY a JSON object in this format:
{
  "recommendations": [
    {
      "name": "Meal name",
      "description": "Brief description",
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fats": 0,
      "prepTime": "20 min",
      "difficulty": "easy",
      "ingredients": ["ingredient 1", "ingredient 2"],
      "matchScore": 95
    }
  ],
  "tip": "A helpful nutrition tip"
}`

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content || '{}'
    return JSON.parse(content)
  } catch (error) {
    console.error('OpenAI API Error:', error)
    throw new Error('Failed to get meal recommendation')
  }
}

// Helper function for nutrition insights
export async function getNutritionInsights(params: {
  weeklyData: {
    date: string
    totalCalories: number
    totalProtein: number
    totalCarbs: number
    totalFats: number
    meals: string[]
  }[]
  goals: {
    calories: number
    protein: number
    carbs: number
    fats: number
  }
  userInfo: {
    goalWeight?: number
    currentWeight?: number
    activityLevel?: string
  }
}) {
  const { weeklyData, goals, userInfo } = params

  const systemPrompt = `You are a professional nutritionist analyzing eating patterns.
Provide actionable insights, identify patterns, and give personalized recommendations.
Be encouraging and constructive. Always return valid JSON.`

  const userPrompt = `Analyze this week's nutrition data and provide insights:

WEEKLY DATA:
${JSON.stringify(weeklyData, null, 2)}

GOALS:
${JSON.stringify(goals, null, 2)}

USER INFO:
${JSON.stringify(userInfo, null, 2)}

Analyze and provide:
1. Overall adherence to goals
2. Patterns (good and areas for improvement)
3. Specific actionable recommendations
4. Progress assessment

Return ONLY a JSON object in this format:
{
  "summary": "Overall assessment in 2-3 sentences",
  "adherence": {
    "calories": 85,
    "protein": 92,
    "carbs": 78,
    "fats": 88
  },
  "strengths": [
    "Positive observation 1",
    "Positive observation 2"
  ],
  "areasForImprovement": [
    "Improvement area 1",
    "Improvement area 2"
  ],
  "recommendations": [
    {
      "category": "Protein",
      "suggestion": "Specific actionable advice",
      "priority": "high"
    }
  ],
  "weeklyTrend": "improving/stable/declining",
  "motivationalMessage": "Encouraging message"
}`

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content || '{}'
    return JSON.parse(content)
  } catch (error) {
    console.error('OpenAI API Error:', error)
    throw new Error('Failed to generate nutrition insights')
  }
}

// ============================================
// WORKOUT PLAN FUNCTIONS (NEW - ADD THESE!)
// ============================================

// Helper function to generate workout plans
export async function generateWorkoutPlan(params: {
  goal: string // muscle_gain, weight_loss, strength, endurance, general_fitness
  fitnessLevel: string // beginner, intermediate, advanced
  equipment: string // gym, home, bodyweight
  duration: number // in minutes
  workoutType?: string // strength, cardio, hiit, flexibility, full_body
  daysPerWeek?: number
  focusAreas?: string[] // chest, back, legs, arms, core, cardio
}) {
  const {
    goal,
    fitnessLevel,
    equipment,
    duration,
    workoutType = 'full_body',
    daysPerWeek = 3,
    focusAreas = [],
  } = params

  const systemPrompt = `You are a professional fitness trainer and workout program designer.
Create effective, safe, and personalized workout plans that help users achieve their fitness goals.
Always return valid JSON in the exact format specified.`

  const userPrompt = `Create a detailed workout plan with the following requirements:

WORKOUT PARAMETERS:
- Goal: ${goal}
- Fitness Level: ${fitnessLevel}
- Equipment Available: ${equipment}
- Duration: ${duration} minutes
- Workout Type: ${workoutType}
- Days per Week: ${daysPerWeek}
${focusAreas.length > 0 ? `- Focus Areas: ${focusAreas.join(', ')}` : ''}

REQUIREMENTS:
1. Workout should be exactly ${duration} minutes including warm-up and cool-down
2. Include warm-up (5 min) and cool-down (5 min)
3. Exercises should match fitness level (avoid advanced moves for beginners)
4. Use only available equipment
5. Include sets, reps, rest times
6. Provide clear instructions and form tips
7. Exercises should progress logically
8. Balanced muscle group targeting

Return ONLY a JSON object in this exact format:
{
  "workoutPlan": {
    "name": "Workout plan name",
    "description": "Brief description of the workout",
    "totalDuration": ${duration},
    "difficulty": "${fitnessLevel}",
    "equipment": ["equipment 1", "equipment 2"],
    "warmUp": {
      "duration": 5,
      "exercises": [
        {
          "name": "Exercise name",
          "duration": "2 min",
          "instructions": "How to perform"
        }
      ]
    },
    "mainWorkout": {
      "exercises": [
        {
          "name": "Exercise name",
          "targetMuscles": ["muscle 1", "muscle 2"],
          "sets": 3,
          "reps": "10-12",
          "restTime": "60 sec",
          "instructions": "Detailed instructions",
          "formTips": ["tip 1", "tip 2"],
          "modifications": {
            "easier": "Easier variation",
            "harder": "Harder variation"
          }
        }
      ]
    },
    "coolDown": {
      "duration": 5,
      "exercises": [
        {
          "name": "Stretch name",
          "duration": "30 sec",
          "instructions": "How to stretch"
        }
      ]
    },
    "tips": [
      "Important tip 1",
      "Important tip 2",
      "Important tip 3"
    ],
    "estimatedCaloriesBurn": 250
  }
}`

  try {
    console.log('Calling OpenAI API for workout generation...')
    
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    console.log('OpenAI response received')
    
    const content = completion.choices[0]?.message?.content || '{}'
    console.log('Parsing JSON response...')
    
    const parsedData = JSON.parse(content)
    console.log('Workout plan generated successfully')
    
    return parsedData
  } catch (error) {
    console.error('OpenAI API Error:', error)
    throw new Error('Failed to generate workout plan')
  }
}

// Helper function to generate weekly workout schedule
export async function generateWeeklyWorkoutSchedule(params: {
  goal: string
  fitnessLevel: string
  equipment: string
  daysPerWeek: number
  sessionDuration: number
}) {
  const {
    goal,
    fitnessLevel,
    equipment,
    daysPerWeek,
    sessionDuration,
  } = params

  const systemPrompt = `You are a professional fitness trainer creating weekly workout schedules.
Design balanced, progressive programs that prevent overtraining and ensure proper recovery.
Always return valid JSON.`

  const userPrompt = `Create a ${daysPerWeek}-day weekly workout schedule with these parameters:

PARAMETERS:
- Goal: ${goal}
- Fitness Level: ${fitnessLevel}
- Equipment: ${equipment}
- Days per Week: ${daysPerWeek}
- Session Duration: ${sessionDuration} minutes each

REQUIREMENTS:
1. Balance muscle groups throughout the week
2. Include rest days strategically
3. Progressive overload principle
4. Variety to prevent boredom
5. Appropriate split based on days available

Return ONLY a JSON object in this format:
{
  "schedule": {
    "weeks": 1,
    "days": [
      {
        "day": 1,
        "dayName": "Monday",
        "focus": "Upper Body",
        "workoutType": "Strength",
        "description": "Focus on chest, back, and shoulders",
        "restDay": false
      }
    ],
    "notes": [
      "Listen to your body",
      "Rest days are important"
    ]
  }
}`

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content || '{}'
    return JSON.parse(content)
  } catch (error) {
    console.error('OpenAI API Error:', error)
    throw new Error('Failed to generate workout schedule')
  }
}

// Helper function to get exercise alternatives
export async function getExerciseAlternatives(params: {
  exerciseName: string
  reason: string // injury, no_equipment, difficulty
  equipment: string
  fitnessLevel: string
}) {
  const {
    exerciseName,
    reason,
    equipment,
    fitnessLevel,
  } = params

  const systemPrompt = `You are a fitness expert providing exercise alternatives.
Suggest safe, effective substitutions that target similar muscle groups.
Always return valid JSON.`

  const userPrompt = `Suggest alternatives for this exercise:

EXERCISE: ${exerciseName}
REASON FOR ALTERNATIVE: ${reason}
AVAILABLE EQUIPMENT: ${equipment}
FITNESS LEVEL: ${fitnessLevel}

Provide 3 alternative exercises that:
1. Target similar muscle groups
2. Match the fitness level
3. Use available equipment
4. Address the reason for substitution

Return ONLY a JSON object in this format:
{
  "alternatives": [
    {
      "name": "Alternative exercise name",
      "targetMuscles": ["muscle 1", "muscle 2"],
      "equipment": "equipment needed",
      "difficulty": "beginner/intermediate/advanced",
      "instructions": "How to perform",
      "whyBetter": "Why this is a good alternative"
    }
  ]
}`

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content || '{}'
    return JSON.parse(content)
  } catch (error) {
    console.error('OpenAI API Error:', error)
    throw new Error('Failed to get exercise alternatives')
  }
}

// Helper to estimate token usage (for budget tracking)
export function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4)
}



// ============================================
// 📂 ADD TO: lib/openai.ts
// ============================================
// PURPOSE: AI Chat Assistant function
// ============================================

// ADD THIS FUNCTION TO YOUR EXISTING lib/openai.ts

interface UserContext {
  name?: string
  goals: {
    calorieGoal?: number
    proteinGoal?: number
    goalWeight?: number
    currentWeight?: number
  }
  recentActivity?: {
    todayCalories?: number
    todayProtein?: number
    lastWorkout?: string
    weekWorkouts?: number
  }
}

export async function chatWithFitnessCoach(params: {
  message: string
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  userContext: UserContext
}) {
  const { message, chatHistory, userContext } = params

  // Build context-aware system prompt
  const systemPrompt = `You are a professional fitness coach and nutritionist assistant. You're helping ${userContext.name || 'the user'} achieve their fitness goals.

USER'S PROFILE:
${userContext.goals.calorieGoal ? `- Daily calorie goal: ${userContext.goals.calorieGoal} kcal` : ''}
${userContext.goals.proteinGoal ? `- Daily protein goal: ${userContext.goals.proteinGoal}g` : ''}
${userContext.goals.currentWeight ? `- Current weight: ${userContext.goals.currentWeight} kg` : ''}
${userContext.goals.goalWeight ? `- Goal weight: ${userContext.goals.goalWeight} kg` : ''}

TODAY'S ACTIVITY:
${userContext.recentActivity?.todayCalories !== undefined ? `- Calories consumed: ${Math.round(userContext.recentActivity.todayCalories)} kcal` : ''}
${userContext.recentActivity?.todayProtein !== undefined ? `- Protein consumed: ${Math.round(userContext.recentActivity.todayProtein)}g` : ''}
${userContext.recentActivity?.weekWorkouts !== undefined ? `- Workouts this week: ${userContext.recentActivity.weekWorkouts}` : ''}

YOUR ROLE:
- Provide personalized fitness and nutrition advice
- Be encouraging and supportive
- Reference their goals and current progress when relevant
- Give specific, actionable recommendations
- Keep responses concise (2-4 paragraphs max)
- Use a friendly, conversational tone
- If they ask about their stats, refer to the data above

IMPORTANT:
- Don't make up data - only use the stats provided above
- If you don't know something about their history, ask them
- Focus on sustainable, healthy approaches
- Never recommend extreme diets or unsafe practices`

  try {
    console.log('💬 Starting chat with AI coach...')
    
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...chatHistory.slice(-10), // Last 10 messages for context
        { role: 'user', content: message },
      ],
      temperature: 0.8,
      max_tokens: 500, // Keep responses concise
      stream: false, // We'll add streaming later
    })

    const response = completion.choices[0]?.message?.content || 'I apologize, but I had trouble processing that. Could you try rephrasing your question?'
    
    console.log('✅ AI coach response generated')
    
    return {
      role: 'assistant' as const,
      content: response,
    }
  } catch (error) {
    console.error('OpenAI Chat Error:', error)
    throw new Error('Failed to get response from fitness coach')
  }
}

// For streaming responses (optional - more advanced)
export async function chatWithFitnessCoachStream(params: {
  message: string
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  userContext: UserContext
}) {
  const { message, chatHistory, userContext } = params

  const systemPrompt = `You are a professional fitness coach and nutritionist assistant. You're helping ${userContext.name || 'the user'} achieve their fitness goals.

USER'S PROFILE:
${userContext.goals.calorieGoal ? `- Daily calorie goal: ${userContext.goals.calorieGoal} kcal` : ''}
${userContext.goals.proteinGoal ? `- Daily protein goal: ${userContext.goals.proteinGoal}g` : ''}
${userContext.goals.currentWeight ? `- Current weight: ${userContext.goals.currentWeight} kg` : ''}
${userContext.goals.goalWeight ? `- Goal weight: ${userContext.goals.goalWeight} kg` : ''}

TODAY'S ACTIVITY:
${userContext.recentActivity?.todayCalories !== undefined ? `- Calories consumed: ${Math.round(userContext.recentActivity.todayCalories)} kcal` : ''}
${userContext.recentActivity?.todayProtein !== undefined ? `- Protein consumed: ${Math.round(userContext.recentActivity.todayProtein)}g` : ''}
${userContext.recentActivity?.weekWorkouts !== undefined ? `- Workouts this week: ${userContext.recentActivity.weekWorkouts}` : ''}

YOUR ROLE:
- Provide personalized fitness and nutrition advice
- Be encouraging and supportive
- Reference their goals and current progress when relevant
- Give specific, actionable recommendations
- Keep responses concise (2-4 paragraphs max)
- Use a friendly, conversational tone`

  const stream = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      ...chatHistory.slice(-10),
      { role: 'user', content: message },
    ],
    temperature: 0.8,
    max_tokens: 500,
    stream: true, // Enable streaming
  })

  return stream
}