'use client'

import React, { useState, useEffect } from 'react'
import VehicleCard from './VehicleCard'

interface VehicleGridProps {
  searchQuery: string
  filters: any
}

// Keep mock data as fallback
const mockVehicles = [
  {
    id: "OVE.BCAA.399641951",
    make: "Ford",
    models: ["Transit Connect"],
    year: "2013",
    bodyStyle: "Cargo Van",
    odometer: 82702,
    bidPrice: 4500,
    buyNowPrice: 6700,
    buyable: true,
    atAuction: false,
    auctionEndTime: "2025-06-16T20:00:00Z",
    exteriorColor: "White",
    locationCity: "Hayward",
    locationZipcode: "94544",
    titleBrandings: ["Salvage"],
    salvageVehicle: true,
    statuses: ["Live"],
    vin: "NM0LS7CNXDT154708",
    mmrPrice: 4350,
    conditionGradeNumeric: 2.1,
  },
  {
    id: "OVE.BCAA.399641952",
    make: "Toyota",
    models: ["Camry"],
    year: "2020",
    bodyStyle: "Sedan",
    odometer: 45000,
    bidPrice: 18500,
    buyNowPrice: 22000,
    buyable: true,
    atAuction: true,
    auctionEndTime: "2025-06-14T15:30:00Z",
    exteriorColor: "Silver",
    locationCity: "Los Angeles",
    locationZipcode: "90210",
    titleBrandings: ["Clean"],
    salvageVehicle: false,
    statuses: ["Live"],
    vin: "4T1G11AK1LU123456",
    mmrPrice: 19500,
    conditionGradeNumeric: 3.8,
  },
  {
    id: "OVE.BCAA.399641953",
    make: "BMW",
    models: ["3 Series"],
    year: "2019",
    bodyStyle: "Sedan",
    odometer: 38000,
    bidPrice: 24500,
    buyNowPrice: 28500,
    buyable: true,
    atAuction: false,
    auctionEndTime: "2025-06-15T18:00:00Z",
    exteriorColor: "Black",
    locationCity: "San Francisco",
    locationZipcode: "94102",
    titleBrandings: ["Clean"],
    salvageVehicle: false,
    statuses: ["Live"],
    vin: "WBA5A7C50KD123456",
    mmrPrice: 26000,
    conditionGradeNumeric: 4.2,
  },
]

export default function VehicleGrid({ searchQuery, filters }: VehicleGridProps) {
  const [vehicles, setVehicles] = useState(mockVehicles)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('bidPrice')
  const [filteredVehicles, setFilteredVehicles] = useState(mockVehicles)

  useEffect(() => {
    async function fetchVehicles() {
      try {
        setLoading(true)
        
        // Build query parameters
        const params = new URLSearchParams()
        if (searchQuery) params.append('search', searchQuery)
        if (filters.priceMin) params.append('priceMin', filters.priceMin)
        if (filters.priceMax) params.append('priceMax', filters.priceMax)
        if (filters.make) params.append('make', filters.make)
        if (filters.bodyStyle) params.append('bodyStyle', filters.bodyStyle)
        if (filters.yearMin) params.append('yearMin', filters.yearMin)
        if (filters.yearMax) params.append('yearMax', filters.yearMax)
        if (filters.salvageOnly) params.append('salvageOnly', 'true')
        if (filters.auctionEnding) params.append('auctionEnding', 'true')
        if (filters.buyItNow) params.append('buyItNow', 'true')
        if (filters.quickFilter) params.append('quickFilter', filters.quickFilter)

        const response = await fetch(`/api/vehicles?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setVehicles(data.vehicles || mockVehicles)
        } else {
          console.log('API not available, using mock data')
          setVehicles(mockVehicles)
        }
      } catch (error) {
        console.log('Failed to fetch vehicles, using mock data:', error)
        setVehicles(mockVehicles)
      } finally {
        setLoading(false)
      }
    }

    fetchVehicles()
  }, [searchQuery, filters])

  useEffect(() => {
    // Apply client-side filtering to mock data if needed
    let filtered = vehicles.filter(vehicle => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const searchableText = `${vehicle.make} ${vehicle.models[0]} ${vehicle.year} ${vehicle.vin}`.toLowerCase()
        if (!searchableText.includes(query)) return false
      }

      // Price filters
      if (filters.priceMin && vehicle.bidPrice < parseInt(filters.priceMin)) return false
      if (filters.priceMax && vehicle.bidPrice > parseInt(filters.priceMax)) return false

      // Make filter
      if (filters.make && vehicle.make !== filters.make) return false

      // Body style filter
      if (filters.bodyStyle && vehicle.bodyStyle !== filters.bodyStyle) return false

      // Year filters
      if (filters.yearMin && parseInt(vehicle.year) < parseInt(filters.yearMin)) return false
      if (filters.yearMax && parseInt(vehicle.year) > parseInt(filters.yearMax)) return false

      // Special filters
      if (filters.salvageOnly && !vehicle.salvageVehicle) return false
      if (filters.buyItNow && !vehicle.buyable) return false

      // Quick filters
      if (filters.quickFilter) {
        switch (filters.quickFilter) {
          case 'live':
            if (!vehicle.atAuction) return false
            break
          case 'ending':
            // For demo, show vehicles ending within 24 hours
            const endTime = new Date(vehicle.auctionEndTime)
            const now = new Date()
            const hoursUntilEnd = (endTime.getTime() - now.getTime()) / (1000 * 60 * 60)
            if (hoursUntilEnd > 24) return false
            break
          case 'buyNow':
            if (!vehicle.buyable) return false
            break
          case 'goodDeals':
            const dealScore = ((vehicle.mmrPrice - vehicle.bidPrice) / vehicle.mmrPrice * 100)
            if (dealScore < 10) return false
            break
        }
      }

      return true
    })

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a] as any
      const bValue = b[sortBy as keyof typeof b] as any
      
      if (sortBy === 'bidPrice' || sortBy === 'odometer') {
        return aValue - bValue
      }
      return String(aValue).localeCompare(String(bValue))
    })

    setFilteredVehicles(filtered)
  }, [vehicles, searchQuery, filters, sortBy])

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(event.target.value)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Loading vehicles...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Results Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {filteredVehicles.length} Vehicles Found
        </h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select 
            className="border border-gray-300 rounded px-3 py-1 text-sm"
            value={sortBy}
            onChange={handleSortChange}
          >
            <option value="bidPrice">Price: Low to High</option>
            <option value="year">Year: Newest First</option>
            <option value="odometer">Mileage: Low to High</option>
            <option value="make">Make: A to Z</option>
          </select>
        </div>
      </div>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredVehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>

      {/* No Results */}
      {filteredVehicles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No vehicles found matching your criteria.</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or search terms.</p>
        </div>
      )}

      {/* Load More Button */}
      {filteredVehicles.length > 0 && (
        <div className="text-center pt-8">
          <button className="btn-primary px-8 py-3 hover:bg-primary-700 transition-colors">
            Load More Vehicles
          </button>
        </div>
      )}
    </div>
  )
} 