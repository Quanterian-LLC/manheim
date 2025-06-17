'use client'

import React, { useState } from 'react'

interface Vehicle {
  id: string
  make: string
  models: string[]
  model?: string
  year: string
  bodyStyle: string
  odometer: number
  bidPrice: number
  buyNowPrice?: number
  buyable: boolean
  atAuction: boolean
  auctionEndTime: string
  exteriorColor: string
  locationCity: string
  locationZipcode: string
  titleBrandings: string[]
  salvageVehicle?: boolean
  salvage?: boolean
  statuses: string[]
  vin: string
  mmr?: number
  mmrPrice?: number
  conditionGradeNumeric: number
  daysOnMarket?: number
}

interface VehicleCardProps {
  vehicle: Vehicle
  listView?: boolean
}

export default function VehicleCard({ vehicle, listView = false }: VehicleCardProps) {
  const [isWatchlisted, setIsWatchlisted] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Simplified time remaining calculation
  const timeRemaining = "2 hours"
  const dealScore = vehicle.mmrPrice && vehicle.bidPrice 
    ? ((vehicle.mmrPrice - vehicle.bidPrice) / vehicle.mmrPrice * 100).toFixed(0)
    : "0"
  const isGoodDeal = parseInt(dealScore) > 10

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'live': return 'bg-green-600 text-white px-2 py-1 rounded text-xs'
      case 'ending': return 'bg-orange-600 text-white px-2 py-1 rounded text-xs'
      case 'sold': return 'bg-gray-600 text-white px-2 py-1 rounded text-xs'
      default: return 'bg-blue-600 text-white px-2 py-1 rounded text-xs'
    }
  }

  const handleBuyNow = async () => {
    setIsProcessing(true)
    try {
      // Simulate API call for Buy Now
      const response = await fetch('/api/vehicles/buy-now', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          price: vehicle.buyNowPrice
        })
      })
      
      if (response.ok) {
        // Handle successful purchase
        console.log('Purchase initiated for vehicle:', vehicle.id)
      }
    } catch (error) {
      console.error('Buy Now failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBidOrView = async () => {
    setIsProcessing(true)
    try {
      if (vehicle.atAuction) {
        // Handle bid placement
        const response = await fetch('/api/vehicles/place-bid', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vehicleId: vehicle.id,
            bidAmount: vehicle.bidPrice + 100 // Increment bid by $100
          })
        })
        
        if (response.ok) {
          console.log('Bid placed for vehicle:', vehicle.id)
        }
      } else {
        // Navigate to vehicle details
        window.location.href = `/vehicles/${vehicle.id}`
      }
    } catch (error) {
      console.error('Action failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleWatchlist = async () => {
    try {
      const response = await fetch('/api/vehicles/watchlist', {
        method: isWatchlisted ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId: vehicle.id
        })
      })
      
      if (response.ok) {
        setIsWatchlisted(!isWatchlisted)
      }
    } catch (error) {
      console.error('Watchlist action failed:', error)
    }
  }

  if (listView) {
    return (
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
        <div className="flex items-center space-x-6">
          {/* Vehicle Image */}
          <div className="relative flex-shrink-0">
            <div className="w-32 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-500 text-2xl">🚗</span>
            </div>
            
            {/* Status Badge */}
            <div className="absolute top-1 left-1">
              <span className={vehicle.atAuction ? 'bg-green-600 text-white px-1 py-0.5 rounded text-xs' : 'bg-blue-600 text-white px-1 py-0.5 rounded text-xs'}>
                {vehicle.atAuction ? 'Live' : 'Buy Now'}
              </span>
            </div>
            
            {/* MMR Analysis Badge */}
            {vehicle.mmr && vehicle.bidPrice && (
              <div className="absolute top-1 right-1">
                {(() => {
                  const percentage = Math.round(((vehicle.bidPrice - vehicle.mmr) / vehicle.mmr) * 100);
                  const isGoodDeal = percentage < -10;
                  return (
                    <span className={`${isGoodDeal ? 'bg-green-600' : 'bg-gray-600'} text-white px-1 py-0.5 rounded text-xs font-medium`}>
                      {percentage > 0 ? '+' : ''}{percentage}%
                    </span>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Vehicle Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">
                  {vehicle.year} {vehicle.make} {vehicle.models?.[0] || vehicle.model || 'Unknown Model'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {vehicle.bodyStyle} • {vehicle.exteriorColor} • {vehicle.odometer?.toLocaleString() || 'N/A'} mi
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  VIN: {vehicle.vin?.slice(-8) || 'N/A'}
                </p>
                
                {/* Title Status */}
                {vehicle.salvageVehicle && (
                  <div className="mt-1">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                      Salvage
                    </span>
                  </div>
                )}
                
                {/* Location & Timing */}
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <span>📍</span>
                    <span>{vehicle.locationCity || 'Unknown Location'}</span>
                  </div>
                  {vehicle.daysOnMarket && (
                    <div className="flex items-center space-x-1">
                      <span>📅</span>
                      <span>{vehicle.daysOnMarket}d on market</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Pricing */}
              <div className="text-right ml-4 flex-shrink-0">
                <div className="space-y-1">
                  <div>
                    <div className="text-xs text-gray-600">Current Price</div>
                    <div className="font-semibold text-lg">${vehicle.bidPrice?.toLocaleString() || 'N/A'}</div>
                  </div>
                  {vehicle.buyNowPrice && (
                    <div>
                      <div className="text-xs text-gray-600">Buy Now</div>
                      <div className="font-semibold text-blue-600">${vehicle.buyNowPrice.toLocaleString()}</div>
                    </div>
                  )}
                  {vehicle.mmr && (
                    <div className="text-xs text-gray-500">
                      MMR: ${vehicle.mmr.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2 flex-shrink-0 w-32">
            <button 
              onClick={handleBuyNow}
              disabled={isProcessing}
              className="bg-blue-600 text-white text-sm py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Update Listing'}
            </button>
            <button 
              onClick={handleBidOrView}
              disabled={isProcessing}
              className="bg-gray-200 text-gray-700 text-sm py-2 rounded hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'View Reports'}
            </button>
            
            {/* Watchlist Button */}
            <button 
              onClick={handleWatchlist}
              className={`p-2 border rounded transition-colors text-sm ${
                isWatchlisted 
                  ? 'text-red-500 border-red-300 bg-red-50' 
                  : 'text-gray-400 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {isWatchlisted ? '❤️ Saved' : '♡ Save'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
      {/* Vehicle Image Placeholder */}
      <div className="relative mb-4">
        <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
          <span className="text-gray-500 text-4xl">🚗</span>
        </div>
        
        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <span className={vehicle.atAuction ? 'bg-green-600 text-white px-2 py-1 rounded text-xs' : 'bg-blue-600 text-white px-2 py-1 rounded text-xs'}>
            {vehicle.atAuction ? 'Live' : 'Buy Now'}
          </span>
        </div>
        
        {/* MMR Analysis Badge */}
        {vehicle.mmr && vehicle.bidPrice && (
          <div className="absolute top-2 right-2">
            {(() => {
              const percentage = Math.round(((vehicle.bidPrice - vehicle.mmr) / vehicle.mmr) * 100);
              const isGoodDeal = percentage < -10;
              return (
                <span className={`${isGoodDeal ? 'bg-green-600' : 'bg-gray-600'} text-white px-2 py-1 rounded text-xs font-medium`}>
                  {percentage > 0 ? '+' : ''}{percentage}% MMR
                </span>
              );
            })()}
          </div>
        )}
        
        {/* Days on Market */}
        {vehicle.daysOnMarket && (
          <div className="absolute bottom-2 left-2">
            <span className="bg-gray-800 text-white px-2 py-1 rounded text-xs">
              {vehicle.daysOnMarket}d
            </span>
          </div>
        )}
        
        {/* Heart Icon */}
        <button 
          onClick={handleWatchlist}
          className={`absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors ${
            isWatchlisted ? 'text-red-500' : 'text-gray-400'
          }`}
        >
          <span className="text-lg">{isWatchlisted ? '❤️' : '♡'}</span>
        </button>
      </div>

      {/* Vehicle Info */}
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-lg">
            {vehicle.year} {vehicle.make} {vehicle.models?.[0] || vehicle.model || 'Unknown Model'}
          </h3>
          <p className="text-gray-600 text-sm">
            {vehicle.bodyStyle} • {vehicle.exteriorColor} • {vehicle.odometer?.toLocaleString() || 'N/A'} mi
          </p>
          <p className="text-gray-500 text-xs mt-1">
            VIN: {vehicle.vin?.slice(-8) || 'N/A'}
          </p>
        </div>

        {/* Title Status */}
        {vehicle.salvageVehicle && (
          <div className="flex items-center space-x-2">
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
              Salvage
            </span>
          </div>
        )}

        {/* Pricing */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Current Price</span>
            <span className="font-semibold text-lg">${vehicle.bidPrice?.toLocaleString() || 'N/A'}</span>
          </div>
          {vehicle.buyNowPrice && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Buy Now</span>
              <span className="font-semibold text-blue-600">${vehicle.buyNowPrice?.toLocaleString() || 'N/A'}</span>
            </div>
          )}
          {(vehicle.mmr || vehicle.mmrPrice) && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">MMR Value</span>
              <span className="text-gray-500">${(vehicle.mmr || vehicle.mmrPrice)?.toLocaleString() || 'N/A'}</span>
            </div>
          )}
        </div>

        {/* Location & Timing */}
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <span>📍</span>
            <span>{vehicle.locationCity || 'Unknown Location'}</span>
          </div>
          {vehicle.daysOnMarket && (
            <div className="flex items-center space-x-1">
              <span>📅</span>
              <span>{vehicle.daysOnMarket}d on market</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <button 
            onClick={handleBuyNow}
            disabled={isProcessing}
            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Update Listing'}
          </button>
          <button 
            onClick={handleBidOrView}
            disabled={isProcessing}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'View Reports'}
          </button>
        </div>
      </div>
    </div>
  )
} 