'use client'

import React, { useState, useEffect } from 'react'
import VehicleCard from './VehicleCard'

interface VehicleGridProps {
  searchQuery: string
  filters: any
  vehicles?: any[]
  loading?: boolean
  totalCount?: number
  currentPage?: number
  onPageChange?: (page: number) => void
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

export default function VehicleGrid({ 
  searchQuery, 
  filters, 
  vehicles = [],
  loading = false,
  totalCount = 0,
  currentPage = 1,
  onPageChange
}: VehicleGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  // Use vehicles from API directly, since sorting/filtering is handled server-side
  const displayVehicles = vehicles.length > 0 ? vehicles : mockVehicles

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Loading state with view toggle */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Loading vehicles...</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">View:</span>
              <div className="flex border border-gray-300 rounded">
                <button className="px-3 py-1 text-sm bg-white text-gray-600">Grid</button>
                <button className="px-3 py-1 text-sm bg-primary-600 text-white">List</button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
              <div className="flex items-center space-x-6">
                <div className="w-32 h-24 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-32 space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Results Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {totalCount > 0 ? `${totalCount.toLocaleString()} Vehicles Found` : `${displayVehicles.length} Vehicles Found`}
        </h2>
        <div className="flex items-center space-x-4">
          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">View:</span>
            <div className="flex border border-gray-300 rounded">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-sm ${
                  viewMode === 'grid' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm ${
                  viewMode === 'list' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayVehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {displayVehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} listView={true} />
          ))}
        </div>
      )}

      {/* No Results */}
      {displayVehicles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No vehicles found matching your criteria.</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or search terms.</p>
        </div>
      )}

      {/* Pagination */}
      {totalCount > 100 && onPageChange && (
        <div className="flex justify-center mt-8">
          <div className="flex space-x-2">
            {currentPage > 1 && (
              <button
                onClick={() => onPageChange(currentPage - 1)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Previous
              </button>
            )}
            
            {[...Array(Math.min(5, Math.ceil(totalCount / 100)))].map((_, i) => {
              const page = i + 1
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-4 py-2 border rounded ${
                    currentPage === page
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              )
            })}
            
            {currentPage < Math.ceil(totalCount / 100) && (
              <button
                onClick={() => onPageChange(currentPage + 1)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Next
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 