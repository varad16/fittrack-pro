'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Trophy, Medal, Crown, Users, Calendar, Target } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { format } from 'date-fns'

interface LeaderboardEntry {
  user: {
    id: string
    name: string
    email: string
    image?: string
  }
  progress: number
  progressPercentage: number
  joinedAt: string
  isCompleted: boolean
  rank: number
}

interface Challenge {
  id: string
  name: string
  description?: string
  challengeType: string
  goalValue: number
  startDate: string
  endDate: string
  isPublic: boolean
}

export default function ChallengeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [resolvedParams.id])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/challenges/${resolvedParams.id}/leaderboard`)
      const data = await res.json()
      
      if (res.ok) {
        setChallenge(data.challenge)
        setLeaderboard(data.leaderboard)
      } else {
        toast.error('Failed to fetch leaderboard')
        router.push('/challenges')
      }
    } catch (error) {
      toast.error('Something went wrong')
      router.push('/challenges')
    } finally {
      setLoading(false)
    }
  }

  const getChallengeTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      distance: '🏃',
      workout_count: '💪',
      weight_loss: '⚖️',
      steps: '👟',
    }
    return icons[type] || '🎯'
  }

  const getChallengeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      distance: 'Distance Challenge',
      workout_count: 'Workout Count Challenge',
      weight_loss: 'Weight Loss Challenge',
      steps: 'Steps Challenge',
    }
    return labels[type] || type
  }

  const getGoalUnit = (type: string) => {
    const units: Record<string, string> = {
      distance: 'km',
      workout_count: 'workouts',
      weight_loss: 'kg',
      steps: 'steps',
    }
    return units[type] || ''
  }

  const formatProgress = (progress: number, type: string) => {
    if (type === 'weight_loss') {
      return progress.toFixed(1)
    }
    if (type === 'distance') {
      return progress.toFixed(2)
    }
    return Math.round(progress).toString()
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</span>
  }

  const isExpired = challenge ? new Date(challenge.endDate) < new Date() : false
  const daysRemaining = challenge ? Math.max(0, Math.ceil((new Date(challenge.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0

  if (loading) {
    return <div className="text-center py-12">Loading challenge...</div>
  }

  if (!challenge) {
    return null
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/challenges">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getChallengeTypeIcon(challenge.challengeType)}</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{challenge.name}</h1>
              <p className="text-gray-600 mt-1">{getChallengeTypeLabel(challenge.challengeType)}</p>
            </div>
          </div>
        </div>
        <Badge variant={isExpired ? 'secondary' : 'default'}>
          {isExpired ? 'Completed' : `${daysRemaining} days left`}
        </Badge>
      </div>

      {/* Challenge Info */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Goal</p>
                <p className="text-xl font-bold">
                  {challenge.goalValue} {getGoalUnit(challenge.challengeType)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="text-xl font-bold">
                  {format(new Date(challenge.startDate), 'MMM d')} - {format(new Date(challenge.endDate), 'MMM d')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Participants</p>
                <p className="text-xl font-bold">{leaderboard.length}</p>
              </div>
            </div>
          </div>

          {challenge.description && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-gray-700">{challenge.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p>No participants yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaderboard.map((entry) => (
                <div
                  key={entry.user.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${
                    entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-12">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* User Info */}
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={entry.user.image} />
                    <AvatarFallback>
                      {entry.user.name?.charAt(0) || entry.user.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold">{entry.user.name || entry.user.email}</h3>
                    <p className="text-sm text-gray-600">
                      Joined {format(new Date(entry.joinedAt), 'MMM d')}
                    </p>
                  </div>

                  {/* Progress */}
                  <div className="flex-1 max-w-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-medium">
                        {formatProgress(entry.progress, challenge.challengeType)}/{challenge.goalValue} {getGoalUnit(challenge.challengeType)}
                      </span>
                    </div>
                    <Progress value={entry.progressPercentage} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      {entry.progressPercentage.toFixed(1)}% complete
                    </p>
                  </div>

                  {/* Completion Badge */}
                  {entry.isCompleted && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      ✅ Completed
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{leaderboard.filter(e => e.isCompleted).length}</p>
            <p className="text-sm text-gray-600">Completed Goal</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {leaderboard.length > 0 ? (leaderboard.reduce((sum, e) => sum + e.progressPercentage, 0) / leaderboard.length).toFixed(1) : 0}%
            </p>
            <p className="text-sm text-gray-600">Avg Progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Medal className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {leaderboard.length > 0 ? formatProgress(leaderboard.reduce((sum, e) => sum + e.progress, 0), challenge.challengeType) : 0}
            </p>
            <p className="text-sm text-gray-600">Total {getChallengeTypeLabel(challenge.challengeType).split(' ')[0]}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

