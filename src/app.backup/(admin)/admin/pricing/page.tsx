'use client'

import { useState, useEffect } from 'react'
import { useAdminAuth, AdminHeader, AdminNav } from '@/components/AdminAuth'
import {
  CurrencyEuroIcon,
  CalendarIcon,
  UserGroupIcon,
  TrophyIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

interface PriceItem {
  id?: string
  name: string
  type: 'event' | 'membership' | 'prize' | 'other'
  amount: number
  description: string
  isActive: boolean
  season: string
  created_at?: string
}

export default function PricingPage() {
  const { isAuth, checking, logout } = useAdminAuth()
  const [prices, setPrices] = useState<PriceItem[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPrice, setEditingPrice] = useState<PriceItem | null>(null)
  const [loading, setLoading] = useState(false)

  const [newPrice, setNewPrice] = useState<PriceItem>({
    name: '',
    type: 'event',
    amount: 0,
    description: '',
    isActive: true,
    season: '2026'
  })

  useEffect(() => {
    if (isAuth) {
      fetchPrices()
    }
  }, [isAuth])

  const fetchPrices = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/pricing')
      if (response.ok) {
        const data = await response.json()
        setPrices(data)
      }
    } catch (error) {
      console.error('Failed to fetch prices:', error)
    }
    setLoading(false)
  }

  const handleSavePrice = async (price: PriceItem) => {
    setLoading(true)
    try {
      const url = editingPrice ? `/api/pricing/${editingPrice.id}` : '/api/pricing'
      const method = editingPrice ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(price)
      })

      if (response.ok) {
        await fetchPrices()
        setShowAddForm(false)
        setEditingPrice(null)
        resetForm()
      } else {
        alert('Failed to save price item')
      }
    } catch (error) {
      console.error('Failed to save price:', error)
      alert('Failed to save price item')
    }
    setLoading(false)
  }

  const handleDeletePrice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this price item?')) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/pricing/${id}`, { method: 'DELETE' })
      if (response.ok) {
        await fetchPrices()
      } else {
        alert('Failed to delete price item')
      }
    } catch (error) {
      console.error('Failed to delete price:', error)
      alert('Failed to delete price item')
    }
    setLoading(false)
  }

  const resetForm = () => {
    setNewPrice({
      name: '',
      type: 'event',
      amount: 0,
      description: '',
      isActive: true,
      season: '2026'
    })
  }

  const startEdit = (price: PriceItem) => {
    setEditingPrice(price)
    setNewPrice({ ...price })
    setShowAddForm(true)
  }

  const getPricesByType = (type: string) => {
    return prices.filter(price => price.type === type && price.isActive)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'event': return <CalendarIcon className="h-5 w-5" />
      case 'membership': return <UserGroupIcon className="h-5 w-5" />
      case 'prize': return <TrophyIcon className="h-5 w-5" />
      default: return <CurrencyEuroIcon className="h-5 w-5" />
    }
  }

  if (checking || !isAuth) return null

  return (
    <div>
      <AdminHeader title="Pricing Management" onLock={logout} />
      <AdminNav current="/admin/pricing" />
      
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pricing Management</h1>
            <p className="text-gray-600">Manage ALGS pricing for events, membership, and prizes</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setEditingPrice(null)
              setShowAddForm(true)
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Price Item</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Event Prices</p>
                <p className="text-2xl font-bold">{getPricesByType('event').length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Membership</p>
                <p className="text-2xl font-bold">{getPricesByType('membership').length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <TrophyIcon className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Prize Items</p>
                <p className="text-2xl font-bold">{getPricesByType('prize').length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <CurrencyEuroIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{prices.filter(p => p.isActive).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingPrice ? 'Edit Price Item' : 'Add New Price Item'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={newPrice.name}
                  onChange={(e) => setNewPrice({ ...newPrice, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Entry Fee - Hollywood Lakes"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={newPrice.type}
                  onChange={(e) => setNewPrice({ ...newPrice, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="event">Event</option>
                  <option value="membership">Membership</option>
                  <option value="prize">Prize</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPrice.amount}
                  onChange={(e) => setNewPrice({ ...newPrice, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Season</label>
                <select
                  value={newPrice.season}
                  onChange={(e) => setNewPrice({ ...newPrice, season: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newPrice.description}
                  onChange={(e) => setNewPrice({ ...newPrice, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newPrice.isActive}
                    onChange={(e) => setNewPrice({ ...newPrice, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => handleSavePrice(newPrice)}
                disabled={loading || !newPrice.name}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingPrice ? 'Update Price' : 'Add Price'}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setEditingPrice(null)
                  resetForm()
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Price List */}
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">All Price Items</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Season
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Loading prices...
                    </td>
                  </tr>
                ) : prices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No price items found. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  prices.map((price) => (
                    <tr key={price.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{price.name}</div>
                          {price.description && (
                            <div className="text-sm text-gray-500">{price.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-500">
                          {getTypeIcon(price.type)}
                          <span className="ml-2 capitalize">{price.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(price.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {price.season}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          price.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {price.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEdit(price)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePrice(price.id!)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}