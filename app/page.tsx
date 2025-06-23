'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import VehicleGrid from './components/VehicleGrid'

interface Vehicle {
  id: string
  year: number
  make: string
  models: string[]
  bodyStyle: string
  exteriorColor: string
  odometer: number
  locationCity: string
  bidPrice: number
  buyNowPrice?: number
  buyable: boolean
  atAuction: boolean
  auctionEndTime?: string
  auctionStartTime?: string
  salvage: boolean
  vin: string
  mmrDifference?: number // buyNowPrice - mmrPrice
  conditionGrade?: number
  carfaxStatus?: string
  autoCheckStatus?: string
  daysOnMarket?: number
  viewCount?: number
  bidCount?: number
  listingStatus?: string
  lastPriceUpdate?: string
  sellerName?: string
  mComVdpUrl?: string
  status?: string
  conditionReportUrl?: string
  vinUrl?: string
}

interface Filters {
  search: string
  make: string
  bodyStyle: string
  yearMin: string
  yearMax: string
  priceMin: string
  priceMax: string
  mileageMax: string
  location: string
  salvageOnly: boolean
  buyNowOnly: boolean
  auctionOnly: boolean
  // Condition filters
  conditionGradeMin: string
  carfaxClean: boolean
  autoCheckClean: boolean
  conditionGradeMax: string
  // New intelligent filters
  sellerTypes: string[]
  mmrDifferenceMin: string
  auctionEndingSoon: boolean // Next 24 hours
  lowMileageOnly: boolean // Under 30k miles
  highValueOnly: boolean // MMR > $15k
  recentListings: boolean // Last 7 days
  pickupRegion: string
  exteriorColor: string
  daysOnMarketMax: string
}

export default function Home() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState('composite_score') // Default sort by composite score (best deals)
  const [refreshing, setRefreshing] = useState(false)
  const [availableSellerTypes, setAvailableSellerTypes] = useState<string[]>([])
  const [lastRefreshTime, setLastRefreshTime] = useState<string | null>(null)
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    make: '',
    bodyStyle: '',
    yearMin: '',
    yearMax: '',
    priceMin: '',
    priceMax: '',
    mileageMax: '',
    location: '',
    salvageOnly: false,
    buyNowOnly: false,
    auctionOnly: false,
    conditionGradeMin: '',
    carfaxClean: false,
    autoCheckClean: false,
    conditionGradeMax: '',
    // New filters
    sellerTypes: [],
    mmrDifferenceMin: '',
    auctionEndingSoon: false,
    lowMileageOnly: false,
    highValueOnly: false,
    recentListings: false,
    pickupRegion: '',
    exteriorColor: '',
    daysOnMarketMax: ''
  })

  const [availableFilters, setAvailableFilters] = useState({
    makes: [] as string[],
    bodyStyles: [] as string[],
    locations: [] as string[],
    pickupRegions: [] as string[],
    exteriorColors: [] as string[]
  })

  // Auto-refresh data when app loads
  const refreshData = async (selectedSellerTypes?: string[]) => {
    setRefreshing(true)
    try {
      console.log('🔄 Refreshing data from Manheim API...')
      
      const response = await fetch('/api/vehicles/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sellerTypes: selectedSellerTypes || [
            "Auction", "Bank", "Captive Finance", "Car Rental",
            "Credit Union", "Independent", "Franchise", "Fleet/Lease", "Finance", "Lease"
          ]
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        console.log(`✅ Successfully refreshed ${result.data.totalSaved} vehicles`)
        setLastRefreshTime(new Date().toLocaleString())
        // After refresh, fetch the updated vehicles
        await fetchVehicles(1)
      } else {
        console.error('❌ Refresh failed:', result.message)
      }
    } catch (error) {
      console.error('❌ Error during refresh:', error)
    } finally {
      setRefreshing(false)
    }
  }

  // Get available seller types
  const fetchSellerTypes = async () => {
    try {
      console.log('🔍 Fetching seller types...')
      const response = await fetch('/api/vehicles/refresh')
      const result = await response.json()
      console.log('📊 Seller types response:', result)
      
      if (result.success && result.data.availableSellerTypes) {
        console.log('✅ Available seller types:', result.data.availableSellerTypes)
        setAvailableSellerTypes(result.data.availableSellerTypes)
      } else {
        console.error('❌ Failed to get seller types:', result)
        // Fallback to hardcoded list if API fails
        const fallbackSellerTypes = [
          "Auction", "Bank", "Captive Finance", "Car Rental",
          "Credit Union", "Independent", "Franchise", "Fleet/Lease", 
          "Finance", "Lease", "Government", "Insurance", "Manufacturer",
          "Nonprofit", "Other", "Personal", "Repossession", "Trade"
        ]
        setAvailableSellerTypes(fallbackSellerTypes)
      }
    } catch (error) {
      console.error('Error fetching seller types:', error)
      // Fallback to hardcoded list if API fails
      const fallbackSellerTypes = [
        "Auction", "Bank", "Captive Finance", "Car Rental",
        "Credit Union", "Independent", "Franchise", "Fleet/Lease", 
        "Finance", "Lease", "Government", "Insurance", "Manufacturer",
        "Nonprofit", "Other", "Personal", "Repossession", "Trade"
      ]
      setAvailableSellerTypes(fallbackSellerTypes)
    }
  }

  // Fetch vehicles with filters
  const fetchVehicles = async (page = 1) => {
    setLoading(true)
    try {
      // Build only necessary parameters (exclude empty values)
      const params: Record<string, string> = {
        page: page.toString(),
        limit: '100',
        sortBy: sortBy
      }

      // Add only non-empty filters to reduce payload
      Object.entries(filters).forEach(([key, value]) => {
        if (key === 'sellerTypes' && Array.isArray(value) && value.length > 0) {
          params[key] = value.join(',')
        } else if (value !== '' && value !== false && !Array.isArray(value)) {
          params[key] = value.toString()
        }
      })

      const searchParams = new URLSearchParams(params)
      
      const response = await fetch(`/api/vehicles?${searchParams}`, {
        headers: {
          'Cache-Control': 'max-age=30' // Client-side caching
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setVehicles(data.vehicles || [])
        setTotalCount(data.total || 0)
        
        if (data.filterOptions) {
          setAvailableFilters(data.filterOptions)
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (err) {
      setError('Error loading vehicles')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initialize application - load existing data first, then allow manual refresh
    const initializeData = async () => {
      console.log('🚀 Initializing application...')
      
      // Always fetch seller types first
      await fetchSellerTypes()
      
      // Load existing vehicles from database (fast)
      await fetchVehicles(1)
      
      // Don't auto-refresh on every load - user can manually refresh if needed
      // This makes the app load much faster
    }
    
    initializeData()
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchVehicles(1)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [filters, sortBy])

  const handleFilterChange = (key: keyof Filters, value: string | boolean | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      make: '',
      bodyStyle: '',
      yearMin: '',
      yearMax: '',
      priceMin: '',
      priceMax: '',
      mileageMax: '',
      location: '',
      salvageOnly: false,
      buyNowOnly: false,
      auctionOnly: false,
      conditionGradeMin: '',
      carfaxClean: false,
      autoCheckClean: false,
      conditionGradeMax: '',
      sellerTypes: [],
      mmrDifferenceMin: '',
      auctionEndingSoon: false,
      lowMileageOnly: false,
      highValueOnly: false,
      recentListings: false,
      pickupRegion: '',
      exteriorColor: '',
      daysOnMarketMax: ''
    })
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchVehicles(page)
  }

  const exportToGoogleSheets = () => {
    // This would integrate with Google Sheets API
    const csvData = vehicles.map(v => ({
      VIN: v.vin,
      Year: v.year,
      Make: v.make,
      Model: v.models?.[0] || '',
      'Current Price': v.bidPrice,
      'Buy Now Price': v.buyNowPrice || '',
      'Condition Grade': v.conditionGrade || '',
      'Carfax Status': v.carfaxStatus || '',
      'Days on Market': v.daysOnMarket || '',
      'Listing Status': v.listingStatus || '',
      Location: v.locationCity
    }))
    
    // Convert to CSV and download
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `autobuyer_inventory_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => fetchVehicles(1)} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl font-bold text-blue-600">
              AutoBuyer Inventory Management
            </h1>
            
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search by VIN, make, model..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Refresh Data Button */}
              <button
                onClick={() => refreshData(filters.sellerTypes)}
                disabled={refreshing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Fetch fresh data from Manheim API (takes 2-3 minutes)"
              >
                {refreshing ? '🔄 Refreshing...' : '🔄 Refresh Data'}
              </button>
              
              {/* Export Button */}
              <button
                onClick={exportToGoogleSheets}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                📊 Export to CSV
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-80 flex-shrink-0 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6 max-h-screen overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Advanced Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-6">
                {/* Sorting */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="composite_score">🎯 Best Deals (High MMR + Low Condition)</option>
                    <option value="mmr_difference">MMR Difference: High to Low</option>
                    <option value="condition_grade_low">Condition Grade: Low to High (Best Value)</option>
                    <option value="condition_grade_high">Condition Grade: High to Low</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                  </select>
                </div>

                {/* Condition & Reports */}
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Condition & Reports</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Condition Grade
                      </label>
                      <select
                        value={filters.conditionGradeMin}
                        onChange={(e) => handleFilterChange('conditionGradeMin', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Any Condition</option>
                        <option value="1">1.0+ (Poor)</option>
                        <option value="2">2.0+ (Fair)</option>
                        <option value="3">3.0+ (Good)</option>
                        <option value="4">4.0+ (Excellent)</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.carfaxClean}
                          onChange={(e) => handleFilterChange('carfaxClean', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Clean Carfax Only</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.autoCheckClean}
                          onChange={(e) => handleFilterChange('autoCheckClean', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Clean AutoCheck Only</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Seller Types Filter */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">
                      Seller Types ({availableSellerTypes.length} available)
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFilterChange('sellerTypes', availableSellerTypes)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Select All
                      </button>
                      <span className="text-xs text-gray-400">|</span>
                      <button
                        onClick={() => handleFilterChange('sellerTypes', [])}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2">
                    {availableSellerTypes.length === 0 ? (
                      <div className="text-sm text-gray-500 italic">Loading seller types...</div>
                    ) : (
                      availableSellerTypes.map((sellerType, index) => (
                        <label key={`${sellerType}-${index}`} className="flex items-center py-1">
                          <input
                            type="checkbox"
                            checked={filters.sellerTypes.includes(sellerType)}
                            onChange={(e) => {
                              const updatedTypes = e.target.checked
                                ? [...filters.sellerTypes, sellerType]
                                : filters.sellerTypes.filter(type => type !== sellerType)
                              handleFilterChange('sellerTypes', updatedTypes)
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{sellerType}</span>
                        </label>
                      ))
                    )}
                    {availableSellerTypes.length > 0 && (
                      <div className="text-xs text-gray-400 pt-2 border-t">
                        Total: {availableSellerTypes.length} seller types
                      </div>
                    )}
                  </div>

                </div>

                {/* Smart Filters */}
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Smart Filters</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.auctionEndingSoon}
                        onChange={(e) => handleFilterChange('auctionEndingSoon', e.target.checked)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">🔥 Ending Soon (24h)</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.lowMileageOnly}
                        onChange={(e) => handleFilterChange('lowMileageOnly', e.target.checked)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">⭐ Low Mileage (&lt;30k)</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.highValueOnly}
                        onChange={(e) => handleFilterChange('highValueOnly', e.target.checked)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">💎 High Value (MMR &gt;$15k)</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.recentListings}
                        onChange={(e) => handleFilterChange('recentListings', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">🆕 Recent Listings (7 days)</span>
                    </label>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min MMR Difference ($)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 2000"
                        value={filters.mmrDifferenceMin}
                        onChange={(e) => handleFilterChange('mmrDifferenceMin', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Days on Market
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 30"
                        value={filters.daysOnMarketMax}
                        onChange={(e) => handleFilterChange('daysOnMarketMax', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Basic Filters */}
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Basic Filters</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                      <select
                        value={filters.make}
                        onChange={(e) => handleFilterChange('make', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Makes</option>
                        {availableFilters.makes.map(make => (
                          <option key={make} value={make}>{make}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Body Style</label>
                      <select
                        value={filters.bodyStyle}
                        onChange={(e) => handleFilterChange('bodyStyle', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Body Styles</option>
                        {availableFilters.bodyStyles.map(style => (
                          <option key={style} value={style}>{style}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Min Price"
                          value={filters.priceMin}
                          onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          placeholder="Max Price"
                          value={filters.priceMax}
                          onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year Range</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Min Year"
                          value={filters.yearMin}
                          onChange={(e) => handleFilterChange('yearMin', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          placeholder="Max Year"
                          value={filters.yearMax}
                          onChange={(e) => handleFilterChange('yearMax', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Mileage</label>
                      <input
                        type="number"
                        placeholder="e.g. 50000"
                        value={filters.mileageMax}
                        onChange={(e) => handleFilterChange('mileageMax', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <select
                        value={filters.location}
                        onChange={(e) => handleFilterChange('location', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Locations</option>
                        {availableFilters.locations.map(location => (
                          <option key={location} value={location}>{location}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Exterior Color</label>
                      <select
                        value={filters.exteriorColor}
                        onChange={(e) => handleFilterChange('exteriorColor', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Colors</option>
                        {availableFilters.exteriorColors.map(color => (
                          <option key={color} value={color}>{color}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Region</label>
                      <select
                        value={filters.pickupRegion}
                        onChange={(e) => handleFilterChange('pickupRegion', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Regions</option>
                        {availableFilters.pickupRegions.map(region => (
                          <option key={region} value={region}>{region}</option>
                        ))}
                      </select>
                    </div>
                    {/* Auction Status Filters */}
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.buyNowOnly}
                          onChange={(e) => handleFilterChange('buyNowOnly', e.target.checked)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">💰 Buy Now Available</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.auctionOnly}
                          onChange={(e) => handleFilterChange('auctionOnly', e.target.checked)}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">🔨 At Auction</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.salvageOnly}
                          onChange={(e) => handleFilterChange('salvageOnly', e.target.checked)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">⚠️ Salvage Only</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Condition Grade Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condition Grade Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min (1.0)"
                      min="1"
                      max="5"
                      step="0.1"
                      value={filters.conditionGradeMin}
                      onChange={(e) => setFilters({...filters, conditionGradeMin: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Max (5.0)"
                      min="1"
                      max="5"
                      step="0.1"
                      value={filters.conditionGradeMax}
                      onChange={(e) => setFilters({...filters, conditionGradeMax: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>


              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header with count and sorting */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AutoBuyer Inventory</h1>
                {refreshing && (
                  <p className="text-blue-600 mt-1 flex items-center">
                    <span className="animate-spin mr-2">🔄</span>
                    Refreshing data from Manheim API...
                  </p>
                )}
                {!loading && !refreshing && (
                  <div className="mt-1">
                    <p className="text-gray-600">
                      {totalCount.toLocaleString()} vehicles found
                    </p>
                    {lastRefreshTime && (
                      <p className="text-xs text-gray-500">
                        Last updated: {lastRefreshTime}
                      </p>
                    )}
                  </div>
                )}
                {currentPage > 1 && !refreshing && (
                  <p className="text-sm text-gray-600">
                    Page {currentPage} of {Math.ceil(totalCount / 100)}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                {filters.sellerTypes.length > 0 && (
                  <div className="text-sm text-gray-600">
                    🎯 {filters.sellerTypes.length} seller type(s) selected
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Grid Component */}
            <VehicleGrid 
              searchQuery={filters.search}
              filters={filters}
              vehicles={vehicles}
              loading={loading}
              totalCount={totalCount}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 