'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, UserPlus, UserMinus, Users, MapPin, Dumbbell, Clock, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { format } from 'date-fns'

interface User {
  id: string
  name: string
  email: string
  image?: string
  createdAt: string
  _count: {
    workouts: number
    activities: number
    followers: number
    following: number
  }
}

interface FeedItem {
  type: 'activity' | 'workout'
  id: string
  user: {
    id: string
    name: string
    email: string
    image?: string
  }
  date: string
  data: any
}

export default function SocialPage() {
  const [users, setUsers] = useState<User[]>([])
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchUsers()
    fetchFeed()
  }, [])

  const fetchUsers = async () => {
    try {
      const query = searchQuery ? `?query=${encodeURIComponent(searchQuery)}` : ''
      const res = await fetch(`/api/social/users${query}`)
      const data = await res.json()
      
      if (res.ok) {
        setUsers(data.users)
      } else {
        toast.error('Failed to fetch users')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const fetchFeed = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/social/feed?limit=20')
      const data = await res.json()
      
      if (res.ok) {
        setFeedItems(data.feedItems)
      } else {
        toast.error('Failed to fetch feed')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchUsers()
  }

  const followUser = async (userId: string) => {
    try {
      const res = await fetch('/api/social/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (res.ok) {
        toast.success('User followed!')
        setFollowingUsers(prev => new Set([...prev, userId]))
        fetchUsers() // Refresh to update follower counts
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to follow user')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const unfollowUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/social/follow?userId=${userId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('User unfollowed!')
        setFollowingUsers(prev => {
          const updated = new Set(prev)
          updated.delete(userId)
          return updated
        })
        fetchUsers() // Refresh to update follower counts
      } else {
        toast.error('Failed to unfollow user')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      running: '🏃',
      cycling: '🚴',
      walking: '🚶',
      hiking: '🥾',
    }
    return icons[type] || '🏃'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Social</h1>
        <p className="text-gray-600 mt-1">Connect with other fitness enthusiasts</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="feed" className="space-y-4">
        <TabsList>
          <TabsTrigger value="feed">Activity Feed</TabsTrigger>
          <TabsTrigger value="discover">Discover People</TabsTrigger>
        </TabsList>

        {/* Activity Feed Tab */}
        <TabsContent value="feed" className="space-y-4">
          {loading ? (
            <p className="text-gray-500 text-center py-8">Loading feed...</p>
          ) : feedItems.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No activities in your feed yet</p>
                <p className="text-sm text-gray-400 mb-4">
                  Follow some users to see their workouts and activities!
                </p>
                <Button onClick={() => {
                  const tabsElement = document.querySelector('[data-state="inactive"]') as HTMLElement
                  tabsElement?.click()
                }}>
                  Discover People
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {feedItems.map((item) => (
                <Card key={`${item.type}-${item.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarImage src={item.user.image} />
                        <AvatarFallback>
                          {item.user.name?.charAt(0) || item.user.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold">{item.user.name || item.user.email}</p>
                          <span className="text-gray-400">•</span>
                          <p className="text-sm text-gray-600">
                            {format(new Date(item.date), 'MMM d, h:mm a')}
                          </p>
                        </div>

                        {item.type === 'activity' && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getActivityIcon(item.data.activityType)}</span>
                              <p className="text-gray-700">
                                Completed a <span className="font-medium capitalize">{item.data.activityType}</span>
                                {item.data.name && ` - ${item.data.name}`}
                              </p>
                            </div>
                            
                            <div className="flex gap-6 text-sm text-gray-600">
                              {item.data.distance && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{item.data.distance.toFixed(2)} km</span>
                                </div>
                              )}
                              {item.data.duration && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{formatDuration(item.data.duration)}</span>
                                </div>
                              )}
                              {item.data.calories && (
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="w-4 h-4" />
                                  <span>{Math.round(item.data.calories)} cal</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {item.type === 'workout' && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Dumbbell className="w-5 h-5 text-blue-500" />
                              <p className="text-gray-700">
                                Completed workout: <span className="font-medium">{item.data.name}</span>
                              </p>
                            </div>
                            
                            <div className="flex gap-6 text-sm text-gray-600">
                              <span>{item.data.exercises?.length || 0} exercises</span>
                              {item.data.duration && (
                                <span>{formatDuration(item.data.duration)}</span>
                              )}
                              {item.data.caloriesBurned && (
                                <span>{Math.round(item.data.caloriesBurned)} cal</span>
                              )}
                            </div>

                            {item.data.exercises && item.data.exercises.length > 0 && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Exercises: </span>
                                {item.data.exercises.slice(0, 3).map((ex: any, idx: number) => ex.exerciseName).join(', ')}
                                {item.data.exercises.length > 3 && '...'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Discover People Tab */}
        <TabsContent value="discover" className="space-y-4">
          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle>Find People</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Search by name or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          <div className="space-y-4">
            {users.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No users found</p>
                  {searchQuery && (
                    <p className="text-sm text-gray-400 mt-2">
                      Try searching for a different name or email
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              users.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={user.image} />
                          <AvatarFallback>
                            {user.name?.charAt(0) || user.email.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <h3 className="font-semibold">{user.name || user.email}</h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <div className="flex gap-4 text-xs text-gray-500 mt-1">
                            <span>{user._count.workouts} workouts</span>
                            <span>{user._count.activities} activities</span>
                            <span>{user._count.followers} followers</span>
                            <span>{user._count.following} following</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {followingUsers.has(user.id) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => unfollowUser(user.id)}
                          >
                            <UserMinus className="w-4 h-4 mr-2" />
                            Unfollow
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => followUser(user.id)}
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Follow
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}