import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Card } from '../../components/ui/Card'
import { supabase } from '../../lib/supabase'
import { Calendar, Users, DollarSign, Ticket } from 'lucide-react'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Stats {
  totalRevenue: number
  ticketsSold: number
  totalEvents: number
  totalAttendees: number
}

interface RecentOrder {
  id: string;
  event_name: string;
  customer_name: string;
  date: string;
  amount: number;
  status: string;
}

export function OrganizerHome() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    ticketsSold: 0,
    totalEvents: 0,
    totalAttendees: 0,
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [salesData, setSalesData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [profile])

  const fetchDashboardData = async () => {
    if (!profile) return

    try {
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, price')
        .eq('organizer_id', profile.id)

      if (eventsError) throw eventsError

      const eventIds = events.map(e => e.id)

      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('created_at, event_id, attendee_id, status, event:events(price)')
        .in('event_id', eventIds)

      if (bookingsError) throw bookingsError

      const totalRevenue = bookings.reduce((sum, b) => sum + (b.event?.price || 0), 0)
      const ticketsSold = bookings.length
      const totalAttendees = new Set(bookings.map(b => b.attendee_id)).size

      // Recent orders
      const { data: recentBookingsData, error: recentError } = await supabase
        .from('bookings')
        .select(`
          id,
          created_at,
          status,
          event:events!inner(title, price, organizer_id),
          attendee:profiles!inner(full_name)
        `)
        .eq('event.organizer_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (recentError) throw recentError;

      const formattedRecentOrders = recentBookingsData.map(b => ({
        id: b.id,
        event_name: b.event.title,
        customer_name: b.attendee.full_name,
        date: new Date(b.created_at).toLocaleDateString(),
        amount: b.event.price,
        status: b.status
      }));

      // Sales data for chart
      const salesByMonth: Record<string, number> = {}
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return d.toISOString().slice(0, 7);
      }).reverse();

      last6Months.forEach(month => { salesByMonth[month] = 0; });
      
      bookings.forEach(b => {
        const month = b.created_at.slice(0, 7)
        if (salesByMonth.hasOwnProperty(month)) {
          salesByMonth[month] += (b.event?.price || 0)
        }
      });
      
      const formattedSalesData = last6Months.map(month => ({
        name: new Date(month + '-02').toLocaleString('default', { month: 'short' }),
        sales: salesByMonth[month]
      }));

      setStats({
        totalRevenue,
        ticketsSold,
        totalEvents: events.length,
        totalAttendees,
      })
      setRecentOrders(formattedRecentOrders);
      setSalesData(formattedSalesData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const statCards = [
    { title: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign },
    { title: 'Tickets Sold', value: stats.ticketsSold, icon: Ticket },
    { title: 'Events', value: stats.totalEvents, icon: Calendar },
    { title: 'Attendees', value: stats.totalAttendees, icon: Users },
  ]

  const getStatusBadge = (status: string) => {
    const base = "px-2 py-1 text-xs rounded-full"
    switch (status) {
      case 'confirmed': return `${base} bg-green-900 text-green-300`;
      case 'cancelled': return `${base} bg-red-900 text-red-300`;
      case 'checked_in': return `${base} bg-blue-900 text-blue-300`;
      default: return `${base} bg-gray-700 text-gray-300`;
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
                <div className="p-3 bg-dark-700 rounded-lg">
                  <Icon className="w-6 h-6 text-gray-300" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <Card className="lg:col-span-3">
          <h2 className="text-xl font-bold text-white mb-4">Sales</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#363636" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1E1E1E', border: '1px solid #363636' }} />
              <Line type="monotone" dataKey="sales" stroke="#FFFFFF" strokeWidth={2} dot={{ r: 4, fill: '#FFFFFF' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-xl font-bold text-white mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-400 uppercase">
                    <tr>
                      <th scope="col" className="py-3 pr-3">Event</th>
                      <th scope="col" className="py-3 pr-3">Customer</th>
                      <th scope="col" className="py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-dark-700">
                        <td className="py-3 pr-3 font-medium text-white whitespace-nowrap">{order.event_name}</td>
                        <td className="py-3 pr-3 text-gray-300">{order.customer_name}</td>
                        <td className="py-3"><span className={getStatusBadge(order.status)}>{order.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent orders</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
