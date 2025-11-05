'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, TrendingDown, TrendingUp, Minus, Scale, Ruler, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface WeightLog {
  id: string
  weight: number
  date: Date
  notes?: string | null
}

interface BodyMeasurement {
  id: string
  date: Date
  neck?: number | null
  chest?: number | null
  waist?: number | null
  hips?: number | null
  bicepLeft?: number | null
  bicepRight?: number | null
  thighLeft?: number | null
  thighRight?: number | null
  calfLeft?: number | null
  calfRight?: number | null
  notes?: string | null
}

export default function ProgressPage() {
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([])
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([])
  const [loading, setLoading] = useState(true)
  const [weightDialogOpen, setWeightDialogOpen] = useState(false)
  const [measurementDialogOpen, setMeasurementDialogOpen] = useState(false)

  const [newWeight, setNewWeight] = useState({
    weight: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const [newMeasurement, setNewMeasurement] = useState({
    date: new Date().toISOString().split('T')[0],
    neck: '',
    chest: '',
    waist: '',
    hips: '',
    bicepLeft: '',
    bicepRight: '',
    thighLeft: '',
    thighRight: '',
    calfLeft: '',
    calfRight: '',
    notes: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [weightRes, measurementRes] = await Promise.all([
        fetch('/api/progress/weight?limit=30'),
        fetch('/api/progress/measurements?limit=10'),
      ])

      const weightData = await weightRes.json()
      const measurementData = await measurementRes.json()

      if (weightRes.ok) setWeightLogs(weightData.weightLogs)
      if (measurementRes.ok) setMeasurements(measurementData.measurements)
    } catch (error) {
      toast.error('Failed to fetch progress data')
    } finally {
      setLoading(false)
    }
  }

  const addWeightLog = async () => {
    if (!newWeight.weight || parseFloat(newWeight.weight) <= 0) {
      toast.error('Please enter a valid weight')
      return
    }

    try {
      const res = await fetch('/api/progress/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: parseFloat(newWeight.weight),
          date: newWeight.date,
          notes: newWeight.notes || null,
        }),
      })

      if (res.ok) {
        toast.success('Weight logged!')
        setWeightDialogOpen(false)
        setNewWeight({ weight: '', date: new Date().toISOString().split('T')[0], notes: '' })
        fetchData()
      } else {
        toast.error('Failed to log weight')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const deleteWeightLog = async (logId: string) => {
    if (!confirm('Delete this weight log?')) return

    try {
      const res = await fetch(`/api/progress/weight?logId=${logId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Weight log deleted!')
        fetchData()
      } else {
        toast.error('Failed to delete weight log')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const addMeasurement = async () => {
    try {
      const res = await fetch('/api/progress/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newMeasurement.date,
          neck: newMeasurement.neck ? parseFloat(newMeasurement.neck) : null,
          chest: newMeasurement.chest ? parseFloat(newMeasurement.chest) : null,
          waist: newMeasurement.waist ? parseFloat(newMeasurement.waist) : null,
          hips: newMeasurement.hips ? parseFloat(newMeasurement.hips) : null,
          bicepLeft: newMeasurement.bicepLeft ? parseFloat(newMeasurement.bicepLeft) : null,
          bicepRight: newMeasurement.bicepRight ? parseFloat(newMeasurement.bicepRight) : null,
          thighLeft: newMeasurement.thighLeft ? parseFloat(newMeasurement.thighLeft) : null,
          thighRight: newMeasurement.thighRight ? parseFloat(newMeasurement.thighRight) : null,
          calfLeft: newMeasurement.calfLeft ? parseFloat(newMeasurement.calfLeft) : null,
          calfRight: newMeasurement.calfRight ? parseFloat(newMeasurement.calfRight) : null,
        //   ...(newMeasurement.notes && { notes: newMeasurement.notes }),
        }),
      })

      if (res.ok) {
        toast.success('Measurements saved!')
        setMeasurementDialogOpen(false)
        setNewMeasurement({
          date: new Date().toISOString().split('T')[0],
          neck: '', chest: '', waist: '', hips: '',
          bicepLeft: '', bicepRight: '', thighLeft: '', thighRight: '',
          calfLeft: '', calfRight: '', notes: '',
        })
        fetchData()
      } else {
        toast.error('Failed to save measurements')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const deleteMeasurement = async (measurementId: string) => {
    if (!confirm('Delete this measurement?')) return

    try {
      const res = await fetch(`/api/progress/measurements?measurementId=${measurementId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Measurement deleted!')
        fetchData()
      } else {
        toast.error('Failed to delete measurement')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  // Calculate stats
  const currentWeight = weightLogs.length > 0 ? weightLogs[0].weight : 0
  const startWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : 0
  const weightChange = currentWeight - startWeight
  const weightChangePercent = startWeight > 0 ? ((weightChange / startWeight) * 100).toFixed(1) : 0

  // Prepare chart data (reverse for chronological order)
  const chartData = [...weightLogs].reverse().map(log => ({
    date: format(new Date(log.date), 'MMM d'),
    weight: log.weight,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Progress</h1>
        <p className="text-gray-600 mt-1">Track your body transformation</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Current Weight</CardTitle>
            <Scale className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentWeight.toFixed(1)} kg</div>
            {weightLogs.length > 1 && (
              <p className="text-xs text-gray-600">
                Started at {startWeight.toFixed(1)} kg
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Weight Change</CardTitle>
            {weightChange < 0 ? (
              <TrendingDown className="w-4 h-4 text-green-500" />
            ) : weightChange > 0 ? (
              <TrendingUp className="w-4 h-4 text-red-500" />
            ) : (
              <Minus className="w-4 h-4 text-gray-400" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              weightChange < 0 ? 'text-green-600' : weightChange > 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
            </div>
            <p className="text-xs text-gray-600">
              {weightChange > 0 ? '+' : ''}{weightChangePercent}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Measurements</CardTitle>
            <Ruler className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{measurements.length}</div>
            <p className="text-xs text-gray-600">Total recordings</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="weight" className="space-y-4">
        <TabsList>
          <TabsTrigger value="weight">Weight Tracking</TabsTrigger>
          <TabsTrigger value="measurements">Body Measurements</TabsTrigger>
        </TabsList>

        {/* Weight Tab */}
        <TabsContent value="weight" className="space-y-4">
          {/* Weight Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Weight Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Weight Logs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Weight History</CardTitle>
              <Dialog open={weightDialogOpen} onOpenChange={setWeightDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Log Weight
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Log Your Weight</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Weight (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="75.5"
                        value={newWeight.weight}
                        onChange={(e) => setNewWeight({ ...newWeight, weight: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={newWeight.date}
                        onChange={(e) => setNewWeight({ ...newWeight, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Notes (optional)</Label>
                      <Input
                        placeholder="How you're feeling"
                        value={newWeight.notes}
                        onChange={(e) => setNewWeight({ ...newWeight, notes: e.target.value })}
                      />
                    </div>
                    <Button onClick={addWeightLog} className="w-full">
                      Save Weight
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {weightLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Scale className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="mb-4">No weight logs yet</p>
                  <Button onClick={() => setWeightDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Log Your First Weight
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {weightLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold">{log.weight} kg</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(log.date), 'MMM d, yyyy')}
                        </p>
                        {log.notes && (
                          <p className="text-sm text-gray-500 italic mt-1">{log.notes}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteWeightLog(log.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Measurements Tab */}
        <TabsContent value="measurements" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Body Measurements</CardTitle>
              <Dialog open={measurementDialogOpen} onOpenChange={setMeasurementDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Measurements
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Record Body Measurements</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={newMeasurement.date}
                        onChange={(e) => setNewMeasurement({ ...newMeasurement, date: e.target.value })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Neck (cm)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="35.5"
                          value={newMeasurement.neck}
                          onChange={(e) => setNewMeasurement({ ...newMeasurement, neck: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Chest (cm)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="95.0"
                          value={newMeasurement.chest}
                          onChange={(e) => setNewMeasurement({ ...newMeasurement, chest: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Waist (cm)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="80.0"
                          value={newMeasurement.waist}
                          onChange={(e) => setNewMeasurement({ ...newMeasurement, waist: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Hips (cm)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="95.0"
                          value={newMeasurement.hips}
                          onChange={(e) => setNewMeasurement({ ...newMeasurement, hips: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Left Bicep (cm)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="35.0"
                          value={newMeasurement.bicepLeft}
                          onChange={(e) => setNewMeasurement({ ...newMeasurement, bicepLeft: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Right Bicep (cm)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="35.0"
                          value={newMeasurement.bicepRight}
                          onChange={(e) => setNewMeasurement({ ...newMeasurement, bicepRight: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Left Thigh (cm)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="55.0"
                          value={newMeasurement.thighLeft}
                          onChange={(e) => setNewMeasurement({ ...newMeasurement, thighLeft: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Right Thigh (cm)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="55.0"
                          value={newMeasurement.thighRight}
                          onChange={(e) => setNewMeasurement({ ...newMeasurement, thighRight: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Left Calf (cm)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="37.0"
                          value={newMeasurement.calfLeft}
                          onChange={(e) => setNewMeasurement({ ...newMeasurement, calfLeft: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Right Calf (cm)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="37.0"
                          value={newMeasurement.calfRight}
                          onChange={(e) => setNewMeasurement({ ...newMeasurement, calfRight: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Notes (optional)</Label>
                      <Input
                        placeholder="Any observations"
                        value={newMeasurement.notes}
                        onChange={(e) => setNewMeasurement({ ...newMeasurement, notes: e.target.value })}
                      />
                    </div>

                    <Button onClick={addMeasurement} className="w-full">
                      Save Measurements
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {measurements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Ruler className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="mb-4">No measurements recorded yet</p>
                  <Button onClick={() => setMeasurementDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Record Your First Measurements
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {measurements.map((measurement) => (
                    <div
                      key={measurement.id}
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <p className="font-semibold">
                          {format(new Date(measurement.date), 'MMMM d, yyyy')}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMeasurement(measurement.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        {measurement.neck && <div>Neck: {measurement.neck} cm</div>}
                        {measurement.chest && <div>Chest: {measurement.chest} cm</div>}
                        {measurement.waist && <div>Waist: {measurement.waist} cm</div>}
                        {measurement.hips && <div>Hips: {measurement.hips} cm</div>}
                        {measurement.bicepLeft && <div>L Bicep: {measurement.bicepLeft} cm</div>}
                        {measurement.bicepRight && <div>R Bicep: {measurement.bicepRight} cm</div>}
                        {measurement.thighLeft && <div>L Thigh: {measurement.thighLeft} cm</div>}
                        {measurement.thighRight && <div>R Thigh: {measurement.thighRight} cm</div>}
                        {measurement.calfLeft && <div>L Calf: {measurement.calfLeft} cm</div>}
                        {measurement.calfRight && <div>R Calf: {measurement.calfRight} cm</div>}
                      </div>
                      {measurement.notes && (
                        <p className="text-sm text-gray-500 italic mt-2">{measurement.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}