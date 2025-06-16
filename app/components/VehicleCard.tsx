'use client'

import React, { useState } from 'react'

interface Vehicle {
  id: string
  make: string
  models: string[]
  year: string
  bodyStyle: string
  odometer: number
  bidPrice: number
  buyNowPrice: number
  buyable: boolean
  atAuction: boolean
  auctionEndTime: string
  exteriorColor: string
  locationCity: string
  locationZipcode: string
  titleBrandings: string[]
  salvageVehicle: boolean
  statuses: string[]
  vin: string
  mmrPrice: number
  conditionGradeNumeric: number
}

interface VehicleCardProps {
  vehicle: Vehicle
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  const [isWatchlisted, setIsWatchlisted] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Simplified time remaining calculation
  const timeRemaining = "2 hours"
  const dealScore = ((vehicle.mmrPrice - vehicle.bidPrice) / vehicle.mmrPrice * 100).toFixed(0)
  const isGoodDeal = parseInt(dealScore) > 10

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'live': return 'status-live'
      case 'ending': return 'status-ending'
      case 'sold': return 'status-sold'
      default: return 'status-live'
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

  return (
    <div className="card hover:shadow-lg transition-shadow">
      {/* Vehicle Image Placeholder */}
      <div className="relative mb-4">
        <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
          <span className="text-gray-500 text-4xl">🚗</span>
        </div>
        
        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <span className={getStatusColor(vehicle.statuses[0])}>
            {vehicle.statuses[0]}
          </span>
        </div>
        
        {/* Good Deal Badge */}
        {isGoodDeal && (
          <div className="absolute top-2 right-2">
            <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
              {dealScore}% below MMR
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
            {vehicle.year} {vehicle.make} {vehicle.models[0]}
          </h3>
          <p className="text-gray-600 text-sm">
            {vehicle.bodyStyle} • {vehicle.exteriorColor} • {vehicle.odometer.toLocaleString()} mi
          </p>
        </div>

        {/* Title Status */}
        {vehicle.salvageVehicle && (
          <div className="flex items-center space-x-2">
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
              {vehicle.titleBrandings.join(', ')}
            </span>
          </div>
        )}

        {/* Pricing */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Current Bid</span>
            <span className="font-semibold text-lg">${vehicle.bidPrice.toLocaleString()}</span>
          </div>
          {vehicle.buyable && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Buy Now</span>
              <span className="font-semibold text-primary-600">${vehicle.buyNowPrice.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">MMR Value</span>
            <span className="text-gray-500">${vehicle.mmrPrice.toLocaleString()}</span>
          </div>
        </div>

        {/* Location & Timing */}
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <span>📍</span>
            <span>{vehicle.locationCity}</span>
          </div>
          {vehicle.atAuction && (
            <div className="flex items-center space-x-1">
              <span>⏰</span>
              <span>Ends in {timeRemaining}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          {vehicle.buyable && (
            <button 
              onClick={handleBuyNow}
              disabled={isProcessing}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Buy Now'}
            </button>
          )}
          <button 
            onClick={handleBidOrView}
            disabled={isProcessing}
            className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : (vehicle.atAuction ? 'Place Bid' : 'View Details')}
          </button>
        </div>
      </div>
    </div>
  )
} 