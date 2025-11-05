'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Plus, Trophy, Users, Calendar, Target, Crown, Medal, Award } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { format } from 'date-fns'

interface Challenge {
  id: string
  name: string
  description?: string
  challengeType: string
  goalValue: number
  startDate: string
  endDate: string
  isPublic: boolean
  creator: {
    id: string
    name: string
    email: string
  }
  participants: any[]
  _count: {
    participants: number
  }
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [publicChallenges, setPublicChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newChallenge, setNewChallenge] = useState({
    name: '',
    description: '',
    challengeType: 'distance',
    goalValue: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week from now
    isPublic: true,
  })

  useEffect(() => {
    fetchChallenges()
    fetchPublicChallenges()
  }, [])

  const fetchChallenges = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/challenges')
      const data = await res.json()
      
      if (res.ok) {
        setChallenges(data.challenges)
      } else {
        toast.error('Failed to fetch challenges')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const fetchPublicChallenges = async () => {
    try {
      const res = await fetch('/api/challenges?type=public')
      const data = await res.json()
      
      if (res.ok) {
        setPublicChallenges(data.challenges)
      }
    } catch (error) {
      console.error('Error fetching public challenges:', error)
    }
  }

  const createChallenge = async () => {
    if (!newChallenge.name.trim() || !newChallenge.goalValue) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newChallenge,
          goalValue: parseFloat(newChallenge.goalValue),
        }),
      })

      if (res.ok) {
        toast.success('Challenge created!')
        setDialogOpen(false)
        setNewChallenge({
          name: '',
          description: '',
          challengeType: 'distance',
          goalValue: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          isPublic: true,
        })
        fetchChallenges()
        fetchPublicChallenges()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create challenge')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const joinChallenge = async (challengeId: string) => {
    try {
      const res = await fetch(`/api/challenges/${challengeId}/join`, {
        method: 'POST',
      })

      if (res.ok) {
        toast.success('Joined challenge!')
        fetchChallenges()
        fetchPublicChallenges()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to join challenge')
      }
    } catch (error) {
      toast.error('Something went wrong')
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
      distance: 'Distance',
      workout_count: 'Workout Count',
      weight_loss: 'Weight Loss',
      steps: 'Steps',
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

  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date()
  }

  const activeChallenges = challenges.filter(c => !isExpired(c.endDate))
  const completedChallenges = challenges.filter(c => isExpired(c.endDate))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Challenges</h1>
          <p className="text-gray-600 mt-1">Compete with friends and achieve your goals</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Challenge
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Challenge</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Challenge Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., January Running Challenge"
                  value={newChallenge.name}
                  onChange={(e) => setNewChallenge({ ...newChallenge, name: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="type">Challenge Type</Label>
                <Select
                  value={newChallenge.challengeType}
                  onValueChange={(value) => setNewChallenge({ ...newChallenge, challengeType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="distance">🏃 Distance Challenge</SelectItem>
                    <SelectItem value="workout_count">💪 Workout Count</SelectItem>
                    <SelectItem value="weight_loss">⚖️ Weight Loss</SelectItem>
                    <SelectItem value="steps">👟 Steps Challenge</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="goal">Goal ({getGoalUnit(newChallenge.challengeType)})</Label>
                <Input
                  id="goal"
                  type="number"
                  placeholder="100"
                  value={newChallenge.goalValue}
                  onChange={(e) => setNewChallenge({ ...newChallenge, goalValue: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start">Start Date</Label>
                  <Input
                    id="start"
                    type="date"
                    value={newChallenge.startDate}
                    onChange={(e) => setNewChallenge({ ...newChallenge, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end">End Date</Label>
                  <Input
                    id="end"
                    type="date"
                    value={newChallenge.endDate}
                    onChange={(e) => setNewChallenge({ ...newChallenge, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="Challenge description"
                  value={newChallenge.description}
                  onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="public"
                  checked={newChallenge.isPublic}
                  onChange={(e) => setNewChallenge({ ...newChallenge, isPublic: e.target.checked })}
                />
                <Label htmlFor="public">Make this challenge public</Label>
              </div>

              <Button onClick={createChallenge} className="w-full">
                Create Challenge
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Challenges</CardTitle>
            <Trophy className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeChallenges.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
            <Medal className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedChallenges.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Public Challenges</CardTitle>
            <Users className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publicChallenges.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Challenges</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        {/* Active Challenges Tab */}
        <TabsContent value="active" className="space-y-4">
          {activeChallenges.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No active challenges</p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Challenge
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeChallenges.map((challenge) => (
                <Card key={challenge.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getChallengeTypeIcon(challenge.challengeType)}</span>
                        <div>
                          <h3 className="text-lg font-semibold">{challenge.name}</h3>
                          <p className="text-sm text-gray-600">
                            {getChallengeTypeLabel(challenge.challengeType)} • Goal: {challenge.goalValue} {getGoalUnit(challenge.challengeType)}
                          </p>
                        </div>
                      </div>
                      <Badge variant={challenge.isPublic ? 'default' : 'secondary'}>
                        {challenge.isPublic ? 'Public' : 'Private'}
                      </Badge>
                    </div>

                    {challenge.description && (
                      <p className="text-gray-600 mb-4">{challenge.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(challenge.startDate), 'MMM d')} - {format(new Date(challenge.endDate), 'MMM d')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{challenge._count.participants} participants</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <Link href={`/challenges/${challenge.id}`}>
                        <Button variant="outline" size="sm">
                          View Leaderboard
                        </Button>
                      </Link>
                      <p className="text-xs text-gray-500">
                        Created by {challenge.creator.name || challenge.creator.email}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Discover Challenges Tab */}
        <TabsContent value="discover" className="space-y-4">
          {publicChallenges.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No public challenges available</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {publicChallenges.map((challenge) => (
                <Card key={challenge.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl">{getChallengeTypeIcon(challenge.challengeType)}</span>
                        <div>
                          <h3 className="text-lg font-semibold">{challenge.name}</h3>
                          <p className="text-sm text-gray-600">
                            {getChallengeTypeLabel(challenge.challengeType)} • Goal: {challenge.goalValue} {getGoalUnit(challenge.challengeType)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            By {challenge.creator.name || challenge.creator.email} • {challenge._count.participants} participants
                          </p>
                        </div>
                      </div>
                      <Button onClick={() => joinChallenge(challenge.id)}>
                        Join Challenge
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Completed Challenges Tab */}
        <TabsContent value="completed" className="space-y-4">
          {completedChallenges.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No completed challenges yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {completedChallenges.map((challenge) => (
                <Card key={challenge.id} className="opacity-75">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getChallengeTypeIcon(challenge.challengeType)}</span>
                        <div>
                          <h3 className="text-lg font-semibold">{challenge.name}</h3>
                          <p className="text-sm text-gray-600">
                            Completed • {challenge._count.participants} participants
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">Finished</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}