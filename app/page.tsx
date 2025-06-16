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
}

export default function Home() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  
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
    auctionOnly: false
  })

  const [availableFilters, setAvailableFilters] = useState({
    makes: [] as string[],
    bodyStyles: [] as string[],
    locations: [] as string[]
  })

  // Fetch vehicles with filters
  const fetchVehicles = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
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
        
        // Set available filter options
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

  // Initial load
  useEffect(() => {
    fetchVehicles(1)
  }, [])

  // Refetch when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchVehicles(1)
    }, 500) // Debounce

    return () => clearTimeout(timeoutId)
  }, [filters])

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
      auctionOnly: false
    })
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchVehicles(page)
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
              Manheim Auctions
            </h1>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by make, model, VIN..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-4">
                {/* Make Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Make
                  </label>
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

                {/* Body Style Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Body Style
                  </label>
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

                {/* Year Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year Range
                  </label>
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

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Range
                  </label>
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

                {/* Mileage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Mileage
                  </label>
                  <input
                    type="number"
                    placeholder="Max Mileage"
                    value={filters.mileageMax}
                    onChange={(e) => handleFilterChange('mileageMax', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
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

                {/* Checkboxes */}
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.salvageOnly}
                      onChange={(e) => handleFilterChange('salvageOnly', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Salvage Only</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.buyNowOnly}
                      onChange={(e) => handleFilterChange('buyNowOnly', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Buy Now Available</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.auctionOnly}
                      onChange={(e) => handleFilterChange('auctionOnly', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Live Auction Only</span>
                  </label>
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
                  {vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
                      {/* Vehicle Image Placeholder */}
                      <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                        <span className="text-gray-500 text-4xl">🚗</span>
                      </div>

                      {/* Vehicle Info */}
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {vehicle.year} {vehicle.make} {vehicle.models?.[0] || 'Unknown'}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {vehicle.bodyStyle} • {vehicle.exteriorColor} • {vehicle.odometer?.toLocaleString()} mi
                          </p>
                        </div>

                        {/* Pricing */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Current Bid</span>
                            <span className="font-semibold text-lg">${vehicle.bidPrice?.toLocaleString()}</span>
                          </div>
                          {vehicle.buyable && vehicle.buyNowPrice && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Buy Now</span>
                              <span className="font-semibold text-blue-600">${vehicle.buyNowPrice.toLocaleString()}</span>
                            </div>
                          )}
                          {vehicle.mmr && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">MMR</span>
                              <span className="text-sm text-gray-800">${vehicle.mmr.toLocaleString()}</span>
                            </div>
                          )}
                        </div>

                        {/* Location & Status */}
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
                            {vehicle.buyable && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                Buy Now
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2 pt-2">
                          {vehicle.buyable && (
                            <button className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors">
                              Buy Now
                            </button>
                          )}
                          <button className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition-colors">
                            {vehicle.atAuction ? 'Place Bid' : 'View Details'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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