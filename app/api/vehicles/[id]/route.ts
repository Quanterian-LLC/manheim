import { NextRequest, NextResponse } from 'next/server'

// Mock detailed vehicle data
const getVehicleDetails = (id: string) => {
  return {
    "source": "OVE",
    "id": id,
    "make": "Ford",
    "models": ["Transit Connect"],
    "year": "2013",
    "bodyStyle": "Cargo Van",
    "bodyType": "Cargo Van",
    "odometer": 82702,
    "bidPrice": 4500,
    "buyNowPrice": 6700,
    "buyable": true,
    "atAuction": false,
    "auctionEndTime": "2025-06-16T20:00:00Z",
    "auctionStartTime": "2025-06-13T20:00:00Z",
    "exteriorColor": "White",
    "interiorColor": "Gray",
    "locationCity": "Hayward",
    "locationZipcode": "94544",
    "titleBrandings": ["Salvage"],
    "salvageVehicle": true,
    "statuses": ["Live"],
    "vin": "NM0LS7CNXDT154708",
    "mmrPrice": 4350,
    "conditionGradeNumeric": 2.1,
    "driveTrain": "FWD",
    "engineFuelType": "Gasoline",
    "engineType": "4 Cylinder",
    "transmission": "Automatic",
    "doorCount": 2,
    "pickupRegion": "West",
    "pickupLocation": "CA - SUISUN CITY",
    "sellerName": "Cherry Downtown Motors",
    "facilitatingAuction": "Manheim San Francisco Bay",
    "conditionReportUrl": "https://inspectionreport.manheim.com/?CLIENT=SIMUC&channel=OVE&disclosureid=2c5922c7-b0d4-4f03-b8f5-cfe844004a72&listingID=399641951",
    "comments": "Title Branding(s):SALVAGE",
    "equipment": ["Air Conditioning", "Power Steering", "AM/FM Radio"],
    "images": [
      "/api/placeholder/800/600",
      "/api/placeholder/800/600",
      "/api/placeholder/800/600"
    ],
    "bidHistory": [
      { bidder: "User123", amount: 3500, timestamp: "2025-06-13T21:00:00Z" },
      { bidder: "User456", amount: 4000, timestamp: "2025-06-13T22:15:00Z" },
      { bidder: "User789", amount: 4500, timestamp: "2025-06-14T08:30:00Z" }
    ]
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vehicleId = params.id
    const vehicle = getVehicleDetails(vehicleId)
    
    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(vehicle)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vehicle details' },
      { status: 500 }
    )
  }
}

// Handle bidding
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vehicleId = params.id
    const { action, amount } = await request.json()
    
    if (action === 'bid') {
      // Validate bid amount
      if (!amount || amount < 0) {
        return NextResponse.json(
          { error: 'Invalid bid amount' },
          { status: 400 }
        )
      }
      
      // Mock bid placement
      const result = {
        success: true,
        message: 'Bid placed successfully',
        newBidPrice: amount,
        bidder: 'CurrentUser',
        timestamp: new Date().toISOString()
      }
      
      return NextResponse.json(result)
    }
    
    if (action === 'buyNow') {
      // Mock buy now
      const result = {
        success: true,
        message: 'Vehicle purchased successfully',
        purchasePrice: 6700,
        buyer: 'CurrentUser',
        timestamp: new Date().toISOString()
      }
      
      return NextResponse.json(result)
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
} 