'use client'

import React, { useState, useEffect } from 'react'
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
  salvage: boolean
  mmr: number
  vin: string
  conditionGrade?: number
  carfaxStatus?: string
  autoCheckStatus?: string
  daysOnMarket?: number
  viewCount?: number
  bidCount?: number
  listingStatus?: string
  lastPriceUpdate?: string
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
  // MMR-based filters
  mmrComparison: string // 'below', 'above', 'near'
  mmrPercentage: string // percentage difference
  // Condition filters
  conditionGradeMin: string
  carfaxClean: boolean
  autoCheckClean: boolean
  // Inventory management filters
  newListings: boolean // last 7 days
  needsRelisting: boolean // no bids/views after X days
  priceReductionNeeded: boolean // overpriced based on MMR
  daysOnMarketMin: string
  daysOnMarketMax: string
}

export default function Home() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState('mmr_value') // Default sort by MMR value
  
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
    mmrComparison: '',
    mmrPercentage: '',
    conditionGradeMin: '',
    carfaxClean: false,
    autoCheckClean: false,
    newListings: false,
    needsRelisting: false,
    priceReductionNeeded: false,
    daysOnMarketMin: '',
    daysOnMarketMax: ''
  })

  const [availableFilters, setAvailableFilters] = useState({
    makes: [] as string[],
    bodyStyles: [] as string[],
    locations: [] as string[]
  })

  // Calculate MMR analysis for a vehicle
  const calculateMMRAnalysis = (vehicle: Vehicle) => {
    // Better null/undefined checking
    if (!vehicle.mmr || vehicle.mmr === null || !vehicle.bidPrice || vehicle.bidPrice === null) {
      console.log(`MMR calculation failed for vehicle ${vehicle.id}: mmr=${vehicle.mmr}, bidPrice=${vehicle.bidPrice}`)
      return { percentage: 0, status: 'unknown', color: 'gray' }
    }
    
    const percentage = ((vehicle.bidPrice - vehicle.mmr) / vehicle.mmr * 100)
    let status = 'fair'
    let color = 'yellow'
    
    if (percentage < -15) {
      status = 'great_deal'
      color = 'green'
    } else if (percentage < -5) {
      status = 'good_deal'
      color = 'blue'
    } else if (percentage > 15) {
      status = 'overpriced'
      color = 'red'
    } else if (percentage > 5) {
      status = 'above_market'
      color = 'orange'
    }
    
    console.log(`MMR calculation for vehicle ${vehicle.id}: bidPrice=${vehicle.bidPrice}, mmr=${vehicle.mmr}, percentage=${Math.round(percentage)}%`)
    return { percentage: Math.round(percentage), status, color }
  }

  // Fetch vehicles with filters
  const fetchVehicles = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sortBy: sortBy,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => 
            value !== '' && value !== false
          )
        )
      })

      const response = await fetch(`/api/vehicles?${params}`)
      if (response.ok) {
        const data = await response.json()
        setVehicles(data.vehicles || [])
        setTotalCount(data.total || 0)
        
        if (data.filterOptions) {
          setAvailableFilters(data.filterOptions)
        }
      } else {
        setError('Failed to fetch vehicles')
      }
    } catch (err) {
      setError('Error loading vehicles')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVehicles(1)
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchVehicles(1)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [filters, sortBy])

  const handleFilterChange = (key: keyof Filters, value: string | boolean) => {
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
      mmrComparison: '',
      mmrPercentage: '',
      conditionGradeMin: '',
      carfaxClean: false,
      autoCheckClean: false,
      newListings: false,
      needsRelisting: false,
      priceReductionNeeded: false,
      daysOnMarketMin: '',
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
      'MMR Value': v.mmr,
      'MMR Difference %': calculateMMRAnalysis(v).percentage,
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
    a.download = `manheim_inventory_${new Date().toISOString().split('T')[0]}.csv`
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
              Manheim Inventory Management
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
                    <option value="mmr_value">MMR Value Analysis</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="days_on_market">Days on Market</option>
                    <option value="condition_grade">Condition Grade</option>
                    <option value="newest">Newest Listings</option>
                  </select>
                </div>

                {/* MMR Analysis Filters */}
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-3">MMR Analysis</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price vs MMR
                      </label>
                      <select
                        value={filters.mmrComparison}
                        onChange={(e) => handleFilterChange('mmrComparison', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Vehicles</option>
                        <option value="below">Below MMR (Good Deals)</option>
                        <option value="above">Above MMR (Overpriced)</option>
                        <option value="near">Near MMR (±5%)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        MMR Difference %
                      </label>
                      <input
                        type="number"
                        placeholder="e.g., 15 for 15%"
                        value={filters.mmrPercentage}
                        onChange={(e) => handleFilterChange('mmrPercentage', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
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

                {/* Inventory Management */}
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Inventory Management</h3>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.newListings}
                          onChange={(e) => handleFilterChange('newListings', e.target.checked)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">New Listings (7 days)</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.needsRelisting}
                          onChange={(e) => handleFilterChange('needsRelisting', e.target.checked)}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Needs Relisting</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.priceReductionNeeded}
                          onChange={(e) => handleFilterChange('priceReductionNeeded', e.target.checked)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Price Reduction Needed</span>
                      </label>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Days on Market
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={filters.daysOnMarketMin}
                          onChange={(e) => handleFilterChange('daysOnMarketMin', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={filters.daysOnMarketMax}
                          onChange={(e) => handleFilterChange('daysOnMarketMax', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
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
                <h1 className="text-2xl font-bold text-gray-900">Manheim Inventory</h1>
                {!loading && (
                  <p className="text-gray-600 mt-1">
                    {totalCount.toLocaleString()} vehicles found
                  </p>
                )}
                {currentPage > 1 && (
                  <p className="text-sm text-gray-600">
                    Page {currentPage} of {Math.ceil(totalCount / 12)}
                  </p>
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