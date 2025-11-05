import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-5xl font-bold text-gray-900">
          Welcome to <span className="text-green-600">FitTrack Pro</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Your complete fitness companion. Track nutrition, workouts, and progress all in one place.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register">
            <Button size="lg" className="text-lg">
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="text-lg">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}