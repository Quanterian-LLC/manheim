'use client'

import React, { useState } from 'react'

interface VehicleImage {
  largeUrl: string
  smallUrl: string
  description?: string
  angle?: string
  dziUrl?: string
  sequence?: number
  category?: string
}

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
  auctionStartTime?: string
  exteriorColor: string
  locationCity: string
  locationZipcode: string
  titleBrandings: string[]
  salvageVehicle?: boolean
  salvage?: boolean
  statuses: string[]
  vin: string
  mmrDifference?: number
  mmrValue?: number
  conditionGradeNumeric: number
  daysOnMarket?: number
  conditionReportUrl?: string
  sellerName?: string
  mComVdpUrl?: string
  status?: string
  vinUrl?: string
  images?: VehicleImage[]
}

interface VehicleCardProps {
  vehicle: Vehicle
  listView?: boolean
}

export default function VehicleCard({ vehicle, listView = false }: VehicleCardProps) {
  const [isWatchlisted, setIsWatchlisted] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  // Removed image functionality
  
  // Simplified time remaining calculation
  const timeRemaining = "2 hours"
  const dealScore = vehicle.mmrDifference && vehicle.bidPrice 
    ? ((vehicle.mmrDifference / vehicle.bidPrice * 100).toFixed(0))
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

  const handleConditionReport = () => {
    if (vehicle.conditionReportUrl) {
      window.open(vehicle.conditionReportUrl, '_blank')
    } else {
      // Generate a mock condition report URL for demo purposes
      const mockUrl = `https://inspectionreport.manheim.com/?CLIENT=SIMUC&channel=OVE&disclosureid=${vehicle.id}&listingID=${vehicle.id}`
      window.open(mockUrl, '_blank')
    }
  }

  const handleManheimDetails = () => {
    if (vehicle.vinUrl) {
      // Open the vinUrl from database
      window.open(vehicle.vinUrl, '_blank')
    } else {
      console.error('No vinUrl available for this vehicle')
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
          <div className="flex-shrink-0">
            <div className="w-48 h-36 bg-gray-200 rounded-lg overflow-hidden">
              {vehicle.images && vehicle.images.length > 0 ? (
                <img
                  src={vehicle.images[0].largeUrl}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.models?.[0] || vehicle.model || 'Unknown Model'}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03MCA3NUw4NSA2MEwxMTUgOTBMMTMwIDc1TDE1MCA5NVYxMjBINTBWOTVMNzAgNzVaIiBmaWxsPSIjOTlBM0FFII8+CjxjaXJjbGUgY3g9IjE3MCIgY3k9IjMwIiByPSIxMCIgZmlsbD0iIzk5QTNBRSIvPgo8dGV4dCB4PSIxMDAiIHk9IjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2QjcyODAiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K'
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 text-4xl mb-2">📷</div>
                    <div className="text-gray-500 text-sm">No Image</div>
                  </div>
                </div>
              )}
            </div>
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
                  VIN: {vehicle.vin || 'N/A'}
                </p>
                <p className="text-green-600 text-xs mt-1 font-medium">
                  <span 
                    onClick={handleConditionReport}
                    className="cursor-pointer hover:underline hover:text-green-700 transition-colors"
                    title="Click to view condition report"
                  >
                    Condition Grade: {vehicle.conditionGradeNumeric ? Number(vehicle.conditionGradeNumeric).toFixed(1) : 'N/A'}/5.0
                  </span>
                </p>
                {vehicle.sellerName && (
                  <p className="text-blue-600 text-xs mt-1 font-medium">
                    Seller: {vehicle.sellerName}
                  </p>
                )}
                {vehicle.status && (
                  <p className="text-gray-700 text-xs mt-1">
                    {vehicle.status}
                  </p>
                )}
                
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
                
                {/* Auction Times */}
                {(vehicle.auctionStartTime || vehicle.auctionEndTime) && (
                  <div className="text-xs text-gray-600 space-y-1">
                    {vehicle.auctionStartTime && vehicle.auctionEndTime ? (
                      <div>
                        Auction Start: {new Date(vehicle.auctionStartTime).toLocaleString()} | 
                        Auction End: {new Date(vehicle.auctionEndTime).toLocaleString()}
                      </div>
                    ) : (
                      <>
                        {vehicle.auctionStartTime && (
                          <div>Auction Start: {new Date(vehicle.auctionStartTime).toLocaleString()}</div>
                        )}
                        {vehicle.auctionEndTime && (
                          <div>Auction End: {new Date(vehicle.auctionEndTime).toLocaleString()}</div>
                        )}
                      </>
                    )}
                  </div>
                )}
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
                  {vehicle.mmrValue && (
                    <div>
                      <div className="text-xs text-gray-600">MMR Price</div>
                      <div className="font-semibold text-purple-600">${vehicle.mmrValue.toLocaleString()}</div>
                    </div>
                  )}
                  {vehicle.mmrDifference !== undefined && (
                    <div>
                      <div className="text-xs text-gray-600">MMR Difference</div>
                      <div className={`font-semibold ${vehicle.mmrDifference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {vehicle.mmrDifference > 0 ? '+' : ''}${Math.abs(vehicle.mmrDifference)?.toLocaleString() || '0'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2 flex-shrink-0 w-32">
            <button 
              onClick={handleManheimDetails}
              className="bg-blue-600 text-white text-sm py-2 rounded hover:bg-blue-700 transition-colors"
              title={`View Details: ${vehicle.vinUrl || 'No URL available'}`}
            >
              🏢 Vehicle Details
            </button>
            
            <button 
              onClick={handleConditionReport}
              className="bg-green-600 text-white text-sm py-2 rounded hover:bg-green-700 transition-colors"
            >
              Condition Report
            </button>
            
            {vehicle.mComVdpUrl && (
              <button 
                onClick={() => window.open(vehicle.mComVdpUrl, '_blank')}
                className="bg-purple-600 text-white text-sm py-2 rounded hover:bg-purple-700 transition-colors"
              >
                View Details
              </button>
            )}
            
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
      {/* Vehicle Image */}
      <div className="mb-4">
        <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
          {vehicle.images && vehicle.images.length > 0 ? (
            <img
              src={vehicle.images[0].largeUrl}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.models?.[0] || vehicle.model || 'Unknown Model'}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDUgMTAwTDEyNSA4MEwxNzUgMTMwTDE5NSAxMTBMMjI1IDEzMFYxNjBINzVWMTMwTDEwNSAxMDBaIiBmaWxsPSIjOTlBM0FFII8+CjxjaXJjbGUgY3g9IjI1NSIgY3k9IjQ1IiByPSIxNSIgZmlsbD0iIzk5QTNBRSIvPgo8dGV4dCB4PSIxNTAiIHk9IjExMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNkI3MjgwIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+Cg=='
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-400 text-6xl mb-2">📷</div>
                <div className="text-gray-500 text-sm">No Image Available</div>
              </div>
            </div>
          )}
        </div>
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
            VIN: {vehicle.vin || 'N/A'}
          </p>
          <p className="text-green-600 text-xs mt-1 font-medium">
            <span 
              onClick={handleConditionReport}
              className="cursor-pointer hover:underline hover:text-green-700 transition-colors"
              title="Click to view condition report"
            >
              Condition Grade: {vehicle.conditionGradeNumeric ? Number(vehicle.conditionGradeNumeric).toFixed(1) : 'N/A'}/5.0
            </span>
          </p>
          {vehicle.sellerName && (
            <p className="text-blue-600 text-xs mt-1 font-medium">
              Seller: {vehicle.sellerName}
            </p>
          )}
          {vehicle.status && (
            <p className="text-gray-700 text-xs mt-1">
              {vehicle.status}
            </p>
          )}
          
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
          
          {/* Auction Times */}
          {(vehicle.auctionStartTime || vehicle.auctionEndTime) && (
            <div className="text-xs text-gray-600 space-y-1">
              {vehicle.auctionStartTime && vehicle.auctionEndTime ? (
                <div>
                  Auction Start: {new Date(vehicle.auctionStartTime).toLocaleString()} | 
                  Auction End: {new Date(vehicle.auctionEndTime).toLocaleString()}
                </div>
              ) : (
                <>
                  {vehicle.auctionStartTime && (
                    <div>Auction Start: {new Date(vehicle.auctionStartTime).toLocaleString()}</div>
                  )}
                  {vehicle.auctionEndTime && (
                    <div>Auction End: {new Date(vehicle.auctionEndTime).toLocaleString()}</div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Current Price</span>
            <span className="font-semibold text-lg">${vehicle.bidPrice?.toLocaleString() || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Buy Now</span>
            <span className="font-semibold text-blue-600">${vehicle.buyNowPrice?.toLocaleString() || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">MMR Price</span>
            <span className="font-semibold text-purple-600">${vehicle.mmrValue?.toLocaleString() || 'N/A'}</span>
          </div>
          {vehicle.mmrDifference !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">MMR Difference</span>
              <span className={`font-semibold ${vehicle.mmrDifference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {vehicle.mmrDifference > 0 ? '+' : ''}${Math.abs(vehicle.mmrDifference)?.toLocaleString() || '0'}
              </span>
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

        {/* Auction Times */}
        {(vehicle.auctionStartTime || vehicle.auctionEndTime) && (
          <div className="text-xs text-gray-600 space-y-1">
            {vehicle.auctionStartTime && vehicle.auctionEndTime ? (
              <div>
                Auction Start: {new Date(vehicle.auctionStartTime).toLocaleString()} | 
                Auction End: {new Date(vehicle.auctionEndTime).toLocaleString()}
              </div>
            ) : (
              <>
                {vehicle.auctionStartTime && (
                  <div>Auction Start: {new Date(vehicle.auctionStartTime).toLocaleString()}</div>
                )}
                {vehicle.auctionEndTime && (
                  <div>Auction End: {new Date(vehicle.auctionEndTime).toLocaleString()}</div>
                )}
              </>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col space-y-2 flex-shrink-0 w-32">
          <button 
            onClick={handleManheimDetails}
            className="bg-blue-600 text-white text-sm py-2 rounded hover:bg-blue-700 transition-colors"
            title={`View Details: ${vehicle.vinUrl || 'No URL available'}`}
          >
            🏢 Vehicle Details
          </button>
          
          <button 
            onClick={handleConditionReport}
            className="bg-green-600 text-white text-sm py-2 rounded hover:bg-green-700 transition-colors"
          >
            Condition Report
          </button>
          
          {vehicle.mComVdpUrl && (
            <button 
              onClick={() => window.open(vehicle.mComVdpUrl, '_blank')}
              className="bg-purple-600 text-white text-sm py-2 rounded hover:bg-purple-700 transition-colors"
            >
              View Details
            </button>
          )}
          
          {/* Watchlist Button */}
          <button 
            onClick={handleWatchlist}
            className={`p-2 border rounded transition-colors text-sm ${
              isWatchlisted ? 'text-red-500 border-red-300 bg-red-50' : 'text-gray-400 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {isWatchlisted ? '❤️ Saved' : '♡ Save'}
          </button>
        </div>
      </div>
    </div>
  )
} 