import { NextRequest, NextResponse } from 'next/server'

const mockAuctions = [
  {
    id: "BCAA",
    name: "Manheim San Francisco Bay",
    location: "Hayward, CA",
    status: "Live",
    vehicleCount: 156,
    startTime: "2025-06-13T20:00:00Z",
    endTime: "2025-06-16T20:00:00Z",
    type: "Online",
    categories: ["Passenger", "Commercial", "Salvage"]
  },
  {
    id: "DCAA",
    name: "Manheim Denver",
    location: "Denver, CO",
    status: "Upcoming",
    vehicleCount: 89,
    startTime: "2025-06-17T18:00:00Z",
    endTime: "2025-06-20T18:00:00Z",
    type: "Physical",
    categories: ["Passenger", "Luxury"]
  },
  {
    id: "TCAA",
    name: "Manheim Texas",
    location: "Dallas, TX",
    status: "Live",
    vehicleCount: 234,
    startTime: "2025-06-14T19:00:00Z",
    endTime: "2025-06-17T19:00:00Z", 
    type: "Hybrid",
    categories: ["Passenger", "Commercial", "Motorcycle"]
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // live, upcoming, ended
    const type = searchParams.get('type') // online, physical, hybrid
    const location = searchParams.get('location')
    
    let filteredAuctions = mockAuctions
    
    if (status) {
      filteredAuctions = filteredAuctions.filter(auction => 
        auction.status.toLowerCase() === status.toLowerCase()
      )
    }
    
    if (type) {
      filteredAuctions = filteredAuctions.filter(auction => 
        auction.type.toLowerCase() === type.toLowerCase()
      )
    }
    
    if (location) {
      filteredAuctions = filteredAuctions.filter(auction => 
        auction.location.toLowerCase().includes(location.toLowerCase())
      )
    }
    
    return NextResponse.json({
      auctions: filteredAuctions,
      summary: {
        total: filteredAuctions.length,
        live: filteredAuctions.filter(a => a.status === 'Live').length,
        upcoming: filteredAuctions.filter(a => a.status === 'Upcoming').length,
        totalVehicles: filteredAuctions.reduce((sum, a) => sum + a.vehicleCount, 0)
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch auctions' },
      { status: 500 }
    )
  }
} 