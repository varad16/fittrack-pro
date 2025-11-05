// ============================================
// 📂 FILE PATH: components/Sidebar.tsx
// ============================================
// PURPOSE: Clean, organized sidebar navigation
// ============================================

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Utensils,
  Dumbbell,
  TrendingUp,
  Sparkles,
  Users,
  Settings,
  ChevronDown,
} from 'lucide-react'
import { useState } from 'react'

// Main navigation items (4-5 max for clean UI)
const mainNavigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: LayoutDashboard 
  },
  { 
    name: 'Nutrition', 
    href: '/nutrition', 
    icon: Utensils,
    subItems: [
      { name: 'Daily Log', href: '/nutrition' },
      { name: 'AI Meal Plan', href: '/ai-meal-plan' },
    ]
  },
  { 
    name: 'Fitness', 
    href: '/workouts', 
    icon: Dumbbell,
    subItems: [
      { name: 'Workouts', href: '/workouts' },
      { name: 'AI Workout Plan', href: '/ai-workout-plan' },
      { name: 'Activities', href: '/activities' },
    ]
  },
  { 
    name: 'Progress', 
    href: '/progress', 
    icon: TrendingUp,
    subItems: [
      { name: 'Overview', href: '/progress' },
      { name: 'Charts', href: '/progress-charts' },
    ]
  },
  { 
    name: 'AI Coach', 
    href: '/ai-coach', 
    icon: Sparkles,
    badge: 'AI'
  },
]

// Secondary navigation (collapsed by default)
const secondaryNavigation = [
  { name: 'Social', href: '/social', icon: Users },
  { name: 'Challenges', href: '/challenges', icon: TrendingUp },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpand = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  const isActive = (href: string) => pathname === href
  const isParentActive = (item: any) => {
    if (item.subItems) {
      return item.subItems.some((sub: any) => pathname === sub.href)
    }
    return pathname === item.href
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-green-600">FitTrack Pro</h1>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {mainNavigation.map((item) => {
          const Icon = item.icon
          const hasSubItems = item.subItems && item.subItems.length > 0
          const isExpanded = expandedItems.includes(item.name)
          const parentActive = isParentActive(item)

          return (
            <div key={item.name}>
              {/* Main Item */}
              {hasSubItems ? (
                <button
                  onClick={() => toggleExpand(item.name)}
                  className={cn(
                    'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors',
                    parentActive
                      ? 'bg-green-50 text-green-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </div>
                  <ChevronDown 
                    className={cn(
                      'w-4 h-4 transition-transform',
                      isExpanded && 'rotate-180'
                    )} 
                  />
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive(item.href)
                      ? 'bg-green-50 text-green-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )}

              {/* Sub Items */}
              {hasSubItems && isExpanded && (
                <div className="ml-9 mt-1 space-y-1">
                  {item.subItems?.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={cn(
                        'block px-4 py-2 rounded-lg text-sm transition-colors',
                        isActive(subItem.href)
                          ? 'bg-green-50 text-green-600 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      {subItem.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* Divider */}
        <div className="border-t border-gray-200 my-4"></div>

        {/* Secondary Navigation */}
        {secondaryNavigation.map((item) => {
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive(item.href)
                  ? 'bg-green-50 text-green-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}