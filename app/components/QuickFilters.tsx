'use client'

import React from 'react'

interface QuickFiltersProps {
  onFilterSelect: (filterType: string) => void
}

const quickFilters = [
  { name: 'Live Auctions', count: 156, color: 'bg-auction-live', filter: 'live' },
  { name: 'Ending Soon', count: 42, color: 'bg-auction-ending', filter: 'ending' },
  { name: 'Buy Now', count: 89, color: 'bg-primary-600', filter: 'buyNow' },
  { name: 'Good Deals', count: 73, color: 'bg-green-600', filter: 'goodDeals' },
  { name: 'Local Pickup', count: 28, color: 'bg-purple-600', filter: 'local' },
  { name: 'No Reserve', count: 34, color: 'bg-red-600', filter: 'noReserve' },
]

export default function QuickFilters({ onFilterSelect }: QuickFiltersProps) {
  const handleFilterClick = (filterType: string) => {
    onFilterSelect(filterType)
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Quick Filters</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {quickFilters.map((filter) => (
          <button
            key={filter.name}
            onClick={() => handleFilterClick(filter.filter)}
            className={`${filter.color} text-white rounded-lg p-4 text-center hover:opacity-90 transition-opacity cursor-pointer`}
          >
            <div className="font-semibold text-sm">{filter.name}</div>
            <div className="text-xs opacity-90">{filter.count} vehicles</div>
          </button>
        ))}
      </div>
    </div>
  )
} 