'use client'

import React, { useState, useEffect } from 'react'

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

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Advanced Filters Sidebar */}
          <div className="lg:col-span-1">
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
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">
                  {loading ? 'Loading...' : `${totalCount.toLocaleString()} Vehicles Found`}
                </h2>
                {currentPage > 1 && (
                  <p className="text-sm text-gray-600">
                    Page {currentPage} of {Math.ceil(totalCount / 12)}
                  </p>
                )}
              </div>
            </div>

            {/* Vehicle Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                    <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No vehicles found matching your criteria.</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {vehicles.map((vehicle) => {
                    const mmrAnalysis = calculateMMRAnalysis(vehicle)
                    
                    return (
                      <div key={vehicle.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
                        {/* Vehicle Image Placeholder */}
                        <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center mb-4 relative">
                          <span className="text-gray-500 text-4xl">🚗</span>
                          
                          {/* MMR Analysis Badge */}
                          <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium text-white bg-${mmrAnalysis.color}-600`}>
                            {mmrAnalysis.percentage > 0 ? '+' : ''}{mmrAnalysis.percentage}% MMR
                          </div>
                          
                          {/* Days on Market */}
                          {vehicle.daysOnMarket && (
                            <div className="absolute top-2 left-2 px-2 py-1 rounded text-xs bg-gray-800 text-white">
                              {vehicle.daysOnMarket}d
                            </div>
                          )}
                        </div>

                        {/* Vehicle Info */}
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {vehicle.year} {vehicle.make} {vehicle.models?.[0] || 'Unknown'}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              VIN: {vehicle.vin?.slice(-8) || 'N/A'} • {vehicle.odometer?.toLocaleString()} mi
                            </p>
                          </div>

                          {/* Pricing Analysis */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Current Price</span>
                              <span className="font-semibold text-lg">${vehicle.bidPrice?.toLocaleString()}</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">MMR Value</span>
                              <span className="text-sm text-gray-800">${vehicle.mmr?.toLocaleString()}</span>
                            </div>
                            
                            {vehicle.buyNowPrice && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Buy Now</span>
                                <span className="font-semibold text-blue-600">${vehicle.buyNowPrice.toLocaleString()}</span>
                              </div>
                            )}
                          </div>

                          {/* Condition & Reports */}
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              {vehicle.conditionGrade && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                  Grade: {vehicle.conditionGrade}
                                </span>
                              )}
                              {vehicle.carfaxStatus === 'clean' && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                  Clean Carfax
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Status Indicators */}
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">📍 {vehicle.locationCity}</span>
                            <div className="flex gap-1">
                              {vehicle.atAuction && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                  Live
                                </span>
                              )}
                              {vehicle.salvage && (
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                                  Salvage
                                </span>
                              )}
                              {mmrAnalysis.status === 'great_deal' && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                  Great Deal
                                </span>
                              )}
                              {mmrAnalysis.status === 'overpriced' && (
                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                                  Overpriced
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex space-x-2 pt-2">
                            <button className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors text-sm">
                              Update Listing
                            </button>
                            <button className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition-colors text-sm">
                              View Reports
                            </button>
                          </div>
                          
                          {/* Price Reduction Suggestion */}
                          {mmrAnalysis.status === 'overpriced' && (
                            <div className="bg-red-50 border border-red-200 rounded p-2 text-sm">
                              <p className="text-red-800 font-medium">💡 Price Reduction Suggested</p>
                              <p className="text-red-600">Consider reducing by ${Math.abs(vehicle.bidPrice - vehicle.mmr).toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Pagination */}
                {totalCount > 12 && (
                  <div className="flex justify-center mt-8">
                    <div className="flex space-x-2">
                      {currentPage > 1 && (
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Previous
                        </button>
                      )}
                      
                      {[...Array(Math.min(5, Math.ceil(totalCount / 12)))].map((_, i) => {
                        const page = i + 1
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-4 py-2 border rounded ${
                              currentPage === page
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      })}
                      
                      {currentPage < Math.ceil(totalCount / 12) && (
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Next
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 