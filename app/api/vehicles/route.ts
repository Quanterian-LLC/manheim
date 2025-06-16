import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

// Mock data as fallback
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Search and filters
    const search = searchParams.get('search') || ''
    const make = searchParams.get('make') || ''
    const bodyStyle = searchParams.get('bodyStyle') || ''
    const yearMin = searchParams.get('yearMin') || ''
    const yearMax = searchParams.get('yearMax') || ''
    const priceMin = searchParams.get('priceMin') || ''
    const priceMax = searchParams.get('priceMax') || ''
    const mileageMax = searchParams.get('mileageMax') || ''
    const location = searchParams.get('location') || ''
    const salvageOnly = searchParams.get('salvageOnly') === 'true'
    const buyNowOnly = searchParams.get('buyNowOnly') === 'true'
    const auctionOnly = searchParams.get('auctionOnly') === 'true'

    // Build MongoDB query
    const query: any = {}

    // Search across multiple fields
    if (search) {
      query.$or = [
        { make: { $regex: search, $options: 'i' } },
        { models: { $elemMatch: { $regex: search, $options: 'i' } } },
        { vin: { $regex: search, $options: 'i' } },
        { bodyStyle: { $regex: search, $options: 'i' } }
      ]
    }

    // Make filter
    if (make) {
      query.make = { $regex: `^${make}$`, $options: 'i' }
    }

    // Body style filter
    if (bodyStyle) {
      query.bodyStyle = { $regex: `^${bodyStyle}$`, $options: 'i' }
    }

    // Year range filter
    if (yearMin || yearMax) {
      query.year = {}
      if (yearMin) query.year.$gte = parseInt(yearMin)
      if (yearMax) query.year.$lte = parseInt(yearMax)
    }

    // Price range filter (using bidPrice)
    if (priceMin || priceMax) {
      query.bidPrice = {}
      if (priceMin) query.bidPrice.$gte = parseInt(priceMin)
      if (priceMax) query.bidPrice.$lte = parseInt(priceMax)
    }

    // Mileage filter
    if (mileageMax) {
      query.odometer = { $lte: parseInt(mileageMax) }
    }

    // Location filter
    if (location) {
      query.locationCity = { $regex: `^${location}$`, $options: 'i' }
    }

    // Special filters
    if (salvageOnly) {
      query.salvage = true
    }

    if (buyNowOnly) {
      query.buyable = true
    }

    if (auctionOnly) {
      query.atAuction = true
    }

    try {
      // Connect to MongoDB
      const { db } = await connectToDatabase()
      const collection = db.collection('manheim_car_data')

      // Get total count for pagination
      const totalCount = await collection.countDocuments(query)

      // Get vehicles with pagination
      const vehicles = await collection
        .find(query)
        .sort({ bidPrice: -1 }) // Sort by price descending
        .skip(skip)
        .limit(limit)
        .toArray()

      // Get filter options for dropdowns (only if no filters applied for performance)
      let filterOptions = {
        makes: [] as string[],
        bodyStyles: [] as string[],
        locations: [] as string[]
      }

      if (!search && !make && !bodyStyle && !location) {
        // Get unique makes
        const makes = await collection.distinct('make', {})
        filterOptions.makes = makes.filter(Boolean).sort()

        // Get unique body styles
        const bodyStyles = await collection.distinct('bodyStyle', {})
        filterOptions.bodyStyles = bodyStyles.filter(Boolean).sort()

        // Get unique locations
        const locations = await collection.distinct('locationCity', {})
        filterOptions.locations = locations.filter(Boolean).sort()
      }

      // Transform vehicles for frontend
      const transformedVehicles = vehicles.map((vehicle: any) => ({
        id: vehicle._id?.toString() || vehicle.id,
        year: vehicle.year,
        make: vehicle.make,
        models: vehicle.models || [],
        bodyStyle: vehicle.bodyStyle,
        exteriorColor: vehicle.exteriorColor,
        odometer: vehicle.odometer,
        locationCity: vehicle.locationCity,
        bidPrice: vehicle.bidPrice,
        buyNowPrice: vehicle.buyNowPrice,
        buyable: vehicle.buyable || false,
        atAuction: vehicle.atAuction || false,
        salvage: vehicle.salvage || false,
        mmr: vehicle.mmr,
        vin: vehicle.vin
      }))

      console.log(`Found ${transformedVehicles.length} vehicles from MongoDB (page ${page}, total: ${totalCount})`)

      return NextResponse.json({
        vehicles: transformedVehicles,
        total: totalCount,
        page,
        totalPages: Math.ceil(totalCount / limit),
        filterOptions
      })

    } catch (dbError) {
      console.error('MongoDB connection failed, using mock data:', dbError)
      
      // Fallback mock data with filtering
      const mockVehicles = [
        {
          id: '1',
          year: 2020,
          make: 'Toyota',
          models: ['Camry'],
          bodyStyle: 'Sedan',
          exteriorColor: 'Silver',
          odometer: 45000,
          locationCity: 'Atlanta',
          bidPrice: 18500,
          buyNowPrice: 22000,
          buyable: true,
          atAuction: true,
          salvage: false,
          mmr: 20000,
          vin: '1HGBH41JXMN109186'
        },
        {
          id: '2',
          year: 2019,
          make: 'Honda',
          models: ['Civic'],
          bodyStyle: 'Sedan',
          exteriorColor: 'Blue',
          odometer: 32000,
          locationCity: 'Dallas',
          bidPrice: 16200,
          buyNowPrice: 19500,
          buyable: true,
          atAuction: false,
          salvage: false,
          mmr: 18000,
          vin: '2HGFC2F59JH542123'
        },
        {
          id: '3',
          year: 2018,
          make: 'Ford',
          models: ['F-150'],
          bodyStyle: 'Pickup',
          exteriorColor: 'Red',
          odometer: 68000,
          locationCity: 'Phoenix',
          bidPrice: 24500,
          buyNowPrice: 28000,
          buyable: false,
          atAuction: true,
          salvage: true,
          mmr: 26000,
          vin: '1FTEW1EP5JFA12345'
        },
        {
          id: '4',
          year: 2021,
          make: 'Chevrolet',
          models: ['Malibu'],
          bodyStyle: 'Sedan',
          exteriorColor: 'White',
          odometer: 25000,
          locationCity: 'Miami',
          bidPrice: 19800,
          buyNowPrice: 23500,
          buyable: true,
          atAuction: true,
          salvage: false,
          mmr: 22000,
          vin: '1G1ZD5ST5MF123456'
        },
        {
          id: '5',
          year: 2017,
          make: 'BMW',
          models: ['3 Series'],
          bodyStyle: 'Sedan',
          exteriorColor: 'Black',
          odometer: 55000,
          locationCity: 'Los Angeles',
          bidPrice: 21500,
          buyNowPrice: 25000,
          buyable: true,
          atAuction: false,
          salvage: false,
          mmr: 23500,
          vin: 'WBA8E9G59HNU12345'
        },
        {
          id: '6',
          year: 2022,
          make: 'Tesla',
          models: ['Model 3'],
          bodyStyle: 'Sedan',
          exteriorColor: 'Blue',
          odometer: 15000,
          locationCity: 'Seattle',
          bidPrice: 35000,
          buyNowPrice: 38000,
          buyable: true,
          atAuction: true,
          salvage: false,
          mmr: 37000,
          vin: '5YJ3E1EA4NF123456'
        }
      ]

      // Apply filters to mock data
      let filteredVehicles = mockVehicles

      if (search) {
        const searchLower = search.toLowerCase()
        filteredVehicles = filteredVehicles.filter(v => 
          v.make.toLowerCase().includes(searchLower) ||
          v.models.some(m => m.toLowerCase().includes(searchLower)) ||
          v.vin.toLowerCase().includes(searchLower) ||
          v.bodyStyle.toLowerCase().includes(searchLower)
        )
      }

      if (make) {
        filteredVehicles = filteredVehicles.filter(v => 
          v.make.toLowerCase() === make.toLowerCase()
        )
      }

      if (bodyStyle) {
        filteredVehicles = filteredVehicles.filter(v => 
          v.bodyStyle.toLowerCase() === bodyStyle.toLowerCase()
        )
      }

      if (yearMin) {
        filteredVehicles = filteredVehicles.filter(v => v.year >= parseInt(yearMin))
      }

      if (yearMax) {
        filteredVehicles = filteredVehicles.filter(v => v.year <= parseInt(yearMax))
      }

      if (priceMin) {
        filteredVehicles = filteredVehicles.filter(v => v.bidPrice >= parseInt(priceMin))
      }

      if (priceMax) {
        filteredVehicles = filteredVehicles.filter(v => v.bidPrice <= parseInt(priceMax))
      }

      if (mileageMax) {
        filteredVehicles = filteredVehicles.filter(v => v.odometer <= parseInt(mileageMax))
      }

      if (location) {
        filteredVehicles = filteredVehicles.filter(v => 
          v.locationCity.toLowerCase() === location.toLowerCase()
        )
      }

      if (salvageOnly) {
        filteredVehicles = filteredVehicles.filter(v => v.salvage)
      }

      if (buyNowOnly) {
        filteredVehicles = filteredVehicles.filter(v => v.buyable)
      }

      if (auctionOnly) {
        filteredVehicles = filteredVehicles.filter(v => v.atAuction)
      }

      // Pagination for mock data
      const totalMockCount = filteredVehicles.length
      const paginatedMockVehicles = filteredVehicles.slice(skip, skip + limit)

      const mockFilterOptions = {
        makes: [...new Set(mockVehicles.map(v => v.make))].sort(),
        bodyStyles: [...new Set(mockVehicles.map(v => v.bodyStyle))].sort(),
        locations: [...new Set(mockVehicles.map(v => v.locationCity))].sort()
      }

      return NextResponse.json({
        vehicles: paginatedMockVehicles,
        total: totalMockCount,
        page,
        totalPages: Math.ceil(totalMockCount / limit),
        filterOptions: mockFilterOptions
      })
    }

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' },
      { status: 500 }
    )
  }
} 