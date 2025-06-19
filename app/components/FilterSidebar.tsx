'use client'
//this is the filter sidebar component
import React, { useState } from 'react'

interface FilterSidebarProps {
  onFilterChange: (filters: any) => void
}

export default function FilterSidebar({ onFilterChange }: FilterSidebarProps) {
  const [filters, setFilters] = useState({
    priceMin: '',
    priceMax: '',
    make: '',
    bodyStyle: '',
    yearMin: '',
    yearMax: '',
    salvageOnly: false,
    auctionEnding: false,
    buyItNow: false
  })

  const handleInputChange = (key: string, value: string | boolean) => {
    const newFilters = {
      ...filters,
      [key]: value
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleApplyFilters = () => {
    onFilterChange(filters)
  }

  const clearFilters = () => {
    const clearedFilters = {
      priceMin: '',
      priceMax: '',
      make: '',
      bodyStyle: '',
      yearMin: '',
      yearMax: '',
      salvageOnly: false,
      auctionEnding: false,
      buyItNow: false
    }
    setFilters(clearedFilters)
    onFilterChange(clearedFilters)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border h-fit">
      <h3 className="text-lg font-semibold mb-4">Filters</h3>
      
      {/* Price Range */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Price Range</h4>
        <div className="flex space-x-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin}
            onChange={(e) => handleInputChange('priceMin', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax}
            onChange={(e) => handleInputChange('priceMax', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Make */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Make</h4>
        <select
          value={filters.make}
          onChange={(e) => handleInputChange('make', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">All Makes</option>
          <option value="Ford">Ford</option>
          <option value="Toyota">Toyota</option>
          <option value="BMW">BMW</option>
          <option value="Honda">Honda</option>
          <option value="Chevrolet">Chevrolet</option>
          <option value="Nissan">Nissan</option>
        </select>
      </div>

      {/* Body Style */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Body Style</h4>
        <select
          value={filters.bodyStyle}
          onChange={(e) => handleInputChange('bodyStyle', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">All Styles</option>
          <option value="Sedan">Sedan</option>
          <option value="SUV">SUV</option>
          <option value="Truck">Truck</option>
          <option value="Coupe">Coupe</option>
          <option value="Cargo Van">Cargo Van</option>
          <option value="Hatchback">Hatchback</option>
        </select>
      </div>

      {/* Year Range */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Year Range</h4>
        <div className="flex space-x-2">
          <input
            type="number"
            placeholder="From"
            value={filters.yearMin}
            onChange={(e) => handleInputChange('yearMin', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <input
            type="number"
            placeholder="To"
            value={filters.yearMax}
            onChange={(e) => handleInputChange('yearMax', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Special Filters */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Special</h4>
        <div className="space-y-2">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={filters.salvageOnly}
              onChange={(e) => handleInputChange('salvageOnly', e.target.checked)}
              className="mr-2 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm">Salvage vehicles only</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={filters.auctionEnding}
              onChange={(e) => handleInputChange('auctionEnding', e.target.checked)}
              className="mr-2 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm">Ending soon</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={filters.buyItNow}
              onChange={(e) => handleInputChange('buyItNow', e.target.checked)}
              className="mr-2 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm">Buy It Now available</span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleApplyFilters}
          className="w-full bg-primary-600 text-white py-2 rounded hover:bg-primary-700 transition-colors"
        >
          Apply Filters
        </button>
        <button
          onClick={clearFilters}
          className="w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition-colors"
        >
          Clear All
        </button>
      </div>
    </div>
  )
} 