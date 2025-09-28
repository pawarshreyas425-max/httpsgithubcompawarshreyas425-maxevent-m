import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Card } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { supabase } from '../../lib/supabase'
import { TrendingUp, Users, Calendar, DollarSign } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

interface AnalysisData {
  bookingsTrend: Array<{ name: string; bookings: number }>
  eventAttendance: Array<{ name: string; attendance: number }>
  categoryDistribution: Array<{ name: string; value: number }>
  kpis: { avgAttendance: number; mostPopularEvent: string; totalRevenue: number; totalEvents: number }
}

export function OrganizerAnalysis() {
  const { profile } = useAuth()
  const [data, setData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) fetchAnalysisData()
  }, [profile])

  const fetchAnalysisData = async () => {
    if (!profile) return
    try {
      const { data: events } = await supabase.from('events').select(`*, bookings(count)`).eq('organizer_id', profile.id)
      const { data: bookings } = await supabase.from('bookings').select(`created_at, event:events!inner(organizer_id, price)`).eq('event.organizer_id', profile.id)
      if (!events || !bookings) return

      const bookingsByMonth: Record<string, number> = {}
      const last6Months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - i); return d.toISOString().slice(0, 7) }).reverse()
      last6Months.forEach(month => { bookingsByMonth[month] = 0 })
      bookings.forEach(b => { const m = b.created_at.slice(0, 7); if (bookingsByMonth.hasOwnProperty(m)) bookingsByMonth[m]++ })
      const bookingsTrend = last6Months.map(m => ({ name: new Date(m + '-02').toLocaleDateString('en-US', { month: 'short' }), bookings: bookingsByMonth[m] }))
      
      const eventAttendance = events.slice(0, 10).map(e => ({ name: e.title.slice(0, 15), attendance: e.bookings?.[0]?.count || 0 }))
      
      const categoryMap: Record<string, number> = {}
      events.forEach(e => { const c = e.category || 'Uncategorized'; categoryMap[c] = (categoryMap[c] || 0) + 1 })
      const categoryDistribution = Object.entries(categoryMap).map(([name, value]) => ({ name, value }))
      
      const totalBookings = bookings.length, totalEvents = events.length
      const avgAttendance = totalEvents > 0 ? (totalBookings / totalEvents) * 100 : 0
      const mostPopular = events.reduce((max, e) => ((e.bookings?.[0]?.count || 0) > (max.bookings?.[0]?.count || 0) ? e : max), events[0])
      const totalRevenue = bookings.reduce((sum, b) => sum + (b.event?.price || 0), 0)

      setData({
        bookingsTrend, eventAttendance, categoryDistribution,
        kpis: { avgAttendance: Math.round(avgAttendance), mostPopularEvent: mostPopular?.title || 'N/A', totalRevenue, totalEvents }
      })
    } catch (error) { console.error('Error fetching analysis data:', error) } finally { setLoading(false) }
  }

  if (loading) return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>
  if (!data) return <div className="text-center"><h1 className="text-3xl font-bold text-white mb-4">Analytics</h1><p className="text-gray-400">No data available yet.</p></div>

  const COLORS = ['#FFFFFF', '#A0A0A0', '#606060', '#404040']
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return <div className="p-2 bg-dark-700 border border-dark-600 rounded-md text-sm"><p className="label text-white">{`${label} : ${payload[0].value}`}</p></div>
    }
    return null
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card><div className="flex items-center justify-between"><div><p className="text-sm text-gray-400 mb-1">Avg Attendance</p><p className="text-2xl font-bold text-white">{data.kpis.avgAttendance}%</p></div><div className="p-3 bg-dark-700 rounded-lg"><TrendingUp className="w-6 h-6 text-gray-300" /></div></div></Card>
        <Card><div className="flex items-center justify-between"><div><p className="text-sm text-gray-400 mb-1">Most Popular</p><p className="text-lg font-bold text-white truncate">{data.kpis.mostPopularEvent}</p></div><div className="p-3 bg-dark-700 rounded-lg"><Users className="w-6 h-6 text-gray-300" /></div></div></Card>
        <Card><div className="flex items-center justify-between"><div><p className="text-sm text-gray-400 mb-1">Total Revenue</p><p className="text-2xl font-bold text-white">${data.kpis.totalRevenue.toFixed(2)}</p></div><div className="p-3 bg-dark-700 rounded-lg"><DollarSign className="w-6 h-6 text-gray-300" /></div></div></Card>
        <Card><div className="flex items-center justify-between"><div><p className="text-sm text-gray-400 mb-1">Total Events</p><p className="text-2xl font-bold text-white">{data.kpis.totalEvents}</p></div><div className="p-3 bg-dark-700 rounded-lg"><Calendar className="w-6 h-6 text-gray-300" /></div></div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card><h2 className="text-xl font-bold text-white mb-4">Bookings Trend</h2><ResponsiveContainer width="100%" height={300}><LineChart data={data.bookingsTrend}><CartesianGrid strokeDasharray="3 3" stroke="#363636" /><XAxis dataKey="name" stroke="#9ca3af" /><YAxis stroke="#9ca3af" /><Tooltip content={<CustomTooltip />} /><Line type="monotone" dataKey="bookings" stroke="#FFFFFF" strokeWidth={2} /></LineChart></ResponsiveContainer></Card>
        <Card><h2 className="text-xl font-bold text-white mb-4">Event Attendance</h2><ResponsiveContainer width="100%" height={300}><BarChart data={data.eventAttendance}><CartesianGrid strokeDasharray="3 3" stroke="#363636" /><XAxis dataKey="name" stroke="#9ca3af" /><YAxis stroke="#9ca3af" /><Tooltip content={<CustomTooltip />} /><Bar dataKey="attendance" fill="#FFFFFF" /></BarChart></ResponsiveContainer></Card>
      </div>

      <Card><h2 className="text-xl font-bold text-white mb-4">Category Distribution</h2><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={data.categoryDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fill="#8884d8">{data.categoryDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip content={<CustomTooltip />} /></PieChart></ResponsiveContainer></Card>
    </div>
  )
}
