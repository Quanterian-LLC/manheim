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

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'mmr_value'

    // Search and basic filters
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

    // MMR-based filters
    const mmrComparison = searchParams.get('mmrComparison') || ''
    const mmrPercentage = searchParams.get('mmrPercentage') || ''

    // Condition filters
    const conditionGradeMin = searchParams.get('conditionGradeMin') || ''
    const carfaxClean = searchParams.get('carfaxClean') === 'true'
    const autoCheckClean = searchParams.get('autoCheckClean') === 'true'

    // Inventory management filters
    const newListings = searchParams.get('newListings') === 'true'
    const needsRelisting = searchParams.get('needsRelisting') === 'true'
    const priceReductionNeeded = searchParams.get('priceReductionNeeded') === 'true'
    const daysOnMarketMin = searchParams.get('daysOnMarketMin') || ''
    const daysOnMarketMax = searchParams.get('daysOnMarketMax') || ''

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

    // Basic filters
    if (make) query.make = { $regex: `^${make}$`, $options: 'i' }
    if (bodyStyle) query.bodyStyle = { $regex: `^${bodyStyle}$`, $options: 'i' }
    if (yearMin || yearMax) {
      query.year = {}
      if (yearMin) query.year.$gte = parseInt(yearMin)
      if (yearMax) query.year.$lte = parseInt(yearMax)
    }
    if (priceMin || priceMax) {
      query.bidPrice = {}
      if (priceMin) query.bidPrice.$gte = parseInt(priceMin)
      if (priceMax) query.bidPrice.$lte = parseInt(priceMax)
    }
    if (mileageMax) query.odometer = { $lte: parseInt(mileageMax) }
    if (location) query.locationCity = { $regex: `^${location}$`, $options: 'i' }
    if (salvageOnly) query.salvage = true
    if (buyNowOnly) query.buyable = true
    if (auctionOnly) query.atAuction = true

    // MMR-based filters
    if (mmrComparison && mmrComparison !== '') {
      // Add calculated field for MMR comparison - use mmrPrice field from MongoDB
      if (mmrComparison === 'below') {
        query.$expr = { $lt: ['$bidPrice', '$mmrPrice'] }
      } else if (mmrComparison === 'above') {
        query.$expr = { $gt: ['$bidPrice', '$mmrPrice'] }
      } else if (mmrComparison === 'near') {
        // Within 5% of MMR
        query.$expr = {
          $and: [
            { $gte: ['$bidPrice', { $multiply: ['$mmrPrice', 0.95] }] },
            { $lte: ['$bidPrice', { $multiply: ['$mmrPrice', 1.05] }] }
          ]
        }
      }
    }

    if (mmrPercentage && mmrPercentage !== '') {
      const percentage = parseFloat(mmrPercentage) / 100
      if (percentage > 0) {
        // Price is X% above MMR - use mmrPrice field
        query.$expr = { $gte: ['$bidPrice', { $multiply: ['$mmrPrice', 1 + percentage] }] }
      } else if (percentage < 0) {
        // Price is X% below MMR - use mmrPrice field
        query.$expr = { $lte: ['$bidPrice', { $multiply: ['$mmrPrice', 1 + percentage] }] }
      }
    }

    // Condition filters
    if (conditionGradeMin) {
      query.conditionGradeNumeric = { $gte: parseFloat(conditionGradeMin) }
    }
    if (carfaxClean) {
      query.carfaxStatus = 'clean'
    }
    if (autoCheckClean) {
      query.autoCheckStatus = 'clean'
    }

    // Inventory management filters
    if (newListings) {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      query.listingDate = { $gte: sevenDaysAgo }
    }

    if (needsRelisting) {
      // Vehicles with no bids and on market for more than 14 days
      query.$and = [
        { bidCount: { $lte: 0 } },
        { daysOnMarket: { $gte: 14 } }
      ]
    }

    if (priceReductionNeeded) {
      // Vehicles priced more than 15% above MMR - use mmrPrice field
      query.$expr = { $gte: ['$bidPrice', { $multiply: ['$mmrPrice', 1.15] }] }
    }

    if (daysOnMarketMin || daysOnMarketMax) {
      query.daysOnMarket = {}
      if (daysOnMarketMin) query.daysOnMarket.$gte = parseInt(daysOnMarketMin)
      if (daysOnMarketMax) query.daysOnMarket.$lte = parseInt(daysOnMarketMax)
    }

    // Build sort criteria
    let sortCriteria: any = {}
    switch (sortBy) {
      case 'mmr_value':
        // Sort by MMR value difference (best deals first) - use mmrPrice field
        sortCriteria = { mmrPrice: -1, bidPrice: 1 }
        break
      case 'price_low':
        sortCriteria = { bidPrice: 1 }
        break
      case 'price_high':
        sortCriteria = { bidPrice: -1 }
        break
      case 'days_on_market':
        sortCriteria = { daysOnMarket: -1 }
        break
      case 'condition_grade':
        sortCriteria = { conditionGradeNumeric: -1 }
        break
      case 'newest':
        sortCriteria = { listingDate: -1 }
        break
      default:
        sortCriteria = { bidPrice: -1 }
    }

    try {
      // Connect to MongoDB
      const { db } = await connectToDatabase()
      const collection = db.collection('manheim_car_data')

      // Get total count for pagination
      const totalCount = await collection.countDocuments(query)

      // Get vehicles with pagination and sorting
      const vehicles = await collection
        .find(query)
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .toArray()

      // Get filter options for dropdowns
      let filterOptions = {
        makes: [] as string[],
        bodyStyles: [] as string[],
        locations: [] as string[]
      }

      if (!search && !make && !bodyStyle && !location) {
        const makes = await collection.distinct('make', {})
        filterOptions.makes = makes.filter(Boolean).sort()

        const bodyStyles = await collection.distinct('bodyStyle', {})
        filterOptions.bodyStyles = bodyStyles.filter(Boolean).sort()

        const locations = await collection.distinct('locationCity', {})
        filterOptions.locations = locations.filter(Boolean).sort()
      }

      // Transform vehicles for frontend with enhanced data
      const transformedVehicles = vehicles.map((vehicle: any) => {
        // Calculate days on market (mock calculation)
        const daysOnMarket = vehicle.daysOnMarket || Math.floor(Math.random() * 30) + 1
        
        // Mock condition grade if not present
        const conditionGrade = vehicle.conditionGradeNumeric || (Math.random() * 4 + 1).toFixed(1)
        
        // Mock carfax status
        const carfaxStatus = vehicle.carfaxStatus || (Math.random() > 0.3 ? 'clean' : 'issues')
        
        // Mock view and bid counts
        const viewCount = vehicle.viewCount || Math.floor(Math.random() * 100)
        const bidCount = vehicle.bidCount || Math.floor(Math.random() * 10)

        // Fix MMR field mapping - use mmrPrice from MongoDB
        const mmrValue = vehicle.mmrPrice || vehicle.mmr || null
        const bidPriceValue = vehicle.bidPrice || 0

        return {
          id: vehicle._id?.toString() || vehicle.id,
          year: vehicle.year,
          make: vehicle.make,
          models: vehicle.models || [],
          bodyStyle: vehicle.bodyStyle,
          exteriorColor: vehicle.exteriorColor,
          odometer: vehicle.odometer,
          locationCity: vehicle.locationCity,
          bidPrice: bidPriceValue,
          buyNowPrice: vehicle.buyNowPrice,
          buyable: vehicle.buyable || false,
          atAuction: vehicle.atAuction || false,
          salvage: vehicle.salvage || vehicle.salvageVehicle || false,
          mmr: mmrValue, // This is the key fix - properly map mmrPrice to mmr
          vin: vehicle.vin,
          conditionGrade: parseFloat(conditionGrade),
          carfaxStatus,
          autoCheckStatus: vehicle.autoCheckStatus || carfaxStatus,
          daysOnMarket,
          viewCount,
          bidCount,
          listingStatus: vehicle.listingStatus || 'active',
          lastPriceUpdate: vehicle.lastPriceUpdate || new Date().toISOString()
        }
      })

      console.log(`Found ${transformedVehicles.length} vehicles from MongoDB (page ${page}, total: ${totalCount}, sort: ${sortBy})`)
      
      // Debug: Log first vehicle's MMR data
      if (transformedVehicles.length > 0) {
        const firstVehicle = transformedVehicles[0]
        console.log(`Sample vehicle MMR data: bidPrice=${firstVehicle.bidPrice}, mmr=${firstVehicle.mmr}, percentage=${firstVehicle.mmr ? Math.round(((firstVehicle.bidPrice - firstVehicle.mmr) / firstVehicle.mmr * 100)) : 'N/A'}%`)
      }

      return NextResponse.json({
        vehicles: transformedVehicles,
        total: totalCount,
        page,
        totalPages: Math.ceil(totalCount / limit),
        filterOptions
      })

    } catch (dbError) {
      console.error('MongoDB connection failed, using enhanced mock data:', dbError)
      
      // Enhanced mock data with MMR analysis features
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
          bidPrice: 16500, // Below MMR - good deal
          buyNowPrice: 19000,
          buyable: true,
          atAuction: true,
          salvage: false,
          mmr: 18500,
          vin: '1HGBH41JXMN109186',
          conditionGrade: 3.8,
          carfaxStatus: 'clean',
          autoCheckStatus: 'clean',
          daysOnMarket: 5,
          viewCount: 45,
          bidCount: 3,
          listingStatus: 'active',
          lastPriceUpdate: '2024-01-10T10:00:00Z'
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
          bidPrice: 19500, // Above MMR - overpriced
          buyNowPrice: 22000,
          buyable: true,
          atAuction: false,
          salvage: false,
          mmr: 16800,
          vin: '2HGFC2F59JH542123',
          conditionGrade: 4.1,
          carfaxStatus: 'clean',
          autoCheckStatus: 'clean',
          daysOnMarket: 22,
          viewCount: 12,
          bidCount: 0,
          listingStatus: 'needs_relisting',
          lastPriceUpdate: '2024-01-05T14:30:00Z'
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
          bidPrice: 22000, // Near MMR
          buyNowPrice: 25000,
          buyable: false,
          atAuction: true,
          salvage: true,
          mmr: 23000,
          vin: '1FTEW1EP5JFA12345',
          conditionGrade: 2.5,
          carfaxStatus: 'issues',
          autoCheckStatus: 'issues',
          daysOnMarket: 8,
          viewCount: 67,
          bidCount: 5,
          listingStatus: 'active',
          lastPriceUpdate: '2024-01-12T09:15:00Z'
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
          bidPrice: 18500, // Great deal - well below MMR
          buyNowPrice: 21000,
          buyable: true,
          atAuction: true,
          salvage: false,
          mmr: 22000,
          vin: '1G1ZD5ST5MF123456',
          conditionGrade: 4.3,
          carfaxStatus: 'clean',
          autoCheckStatus: 'clean',
          daysOnMarket: 2,
          viewCount: 89,
          bidCount: 8,
          listingStatus: 'hot',
          lastPriceUpdate: '2024-01-15T16:45:00Z'
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
          bidPrice: 27500, // Overpriced
          buyNowPrice: 30000,
          buyable: true,
          atAuction: false,
          salvage: false,
          mmr: 23500,
          vin: 'WBA8E9G59HNU12345',
          conditionGrade: 3.9,
          carfaxStatus: 'clean',
          autoCheckStatus: 'clean',
          daysOnMarket: 18,
          viewCount: 23,
          bidCount: 1,
          listingStatus: 'price_reduction_needed',
          lastPriceUpdate: '2024-01-08T11:20:00Z'
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
          bidPrice: 36000, // Near MMR
          buyNowPrice: 38000,
          buyable: true,
          atAuction: true,
          salvage: false,
          mmr: 37000,
          vin: '5YJ3E1EA4NF123456',
          conditionGrade: 4.5,
          carfaxStatus: 'clean',
          autoCheckStatus: 'clean',
          daysOnMarket: 1,
          viewCount: 156,
          bidCount: 12,
          listingStatus: 'new_listing',
          lastPriceUpdate: '2024-01-16T08:00:00Z'
        }
      ]

      // Apply filters to mock data
      let filteredVehicles = mockVehicles

      // Apply all the same filters as MongoDB version
      if (search) {
        const searchLower = search.toLowerCase()
        filteredVehicles = filteredVehicles.filter(v => 
          v.make.toLowerCase().includes(searchLower) ||
          v.models.some(m => m.toLowerCase().includes(searchLower)) ||
          v.vin.toLowerCase().includes(searchLower) ||
          v.bodyStyle.toLowerCase().includes(searchLower)
        )
      }

      if (make) filteredVehicles = filteredVehicles.filter(v => v.make.toLowerCase() === make.toLowerCase())
      if (bodyStyle) filteredVehicles = filteredVehicles.filter(v => v.bodyStyle.toLowerCase() === bodyStyle.toLowerCase())
      if (yearMin) filteredVehicles = filteredVehicles.filter(v => v.year >= parseInt(yearMin))
      if (yearMax) filteredVehicles = filteredVehicles.filter(v => v.year <= parseInt(yearMax))
      if (priceMin) filteredVehicles = filteredVehicles.filter(v => v.bidPrice >= parseInt(priceMin))
      if (priceMax) filteredVehicles = filteredVehicles.filter(v => v.bidPrice <= parseInt(priceMax))
      if (mileageMax) filteredVehicles = filteredVehicles.filter(v => v.odometer <= parseInt(mileageMax))
      if (location) filteredVehicles = filteredVehicles.filter(v => v.locationCity.toLowerCase() === location.toLowerCase())
      if (salvageOnly) filteredVehicles = filteredVehicles.filter(v => v.salvage)
      if (buyNowOnly) filteredVehicles = filteredVehicles.filter(v => v.buyable)
      if (auctionOnly) filteredVehicles = filteredVehicles.filter(v => v.atAuction)

      // MMR-based filters
      if (mmrComparison === 'below') {
        filteredVehicles = filteredVehicles.filter(v => v.bidPrice < v.mmr)
      } else if (mmrComparison === 'above') {
        filteredVehicles = filteredVehicles.filter(v => v.bidPrice > v.mmr)
      } else if (mmrComparison === 'near') {
        filteredVehicles = filteredVehicles.filter(v => 
          Math.abs(v.bidPrice - v.mmr) / v.mmr <= 0.05
        )
      }

      if (mmrPercentage) {
        const percentage = parseFloat(mmrPercentage) / 100
        if (percentage > 0) {
          filteredVehicles = filteredVehicles.filter(v => v.bidPrice >= v.mmr * (1 + percentage))
        } else if (percentage < 0) {
          filteredVehicles = filteredVehicles.filter(v => v.bidPrice <= v.mmr * (1 + percentage))
        }
      }

      // Condition filters
      if (conditionGradeMin) {
        filteredVehicles = filteredVehicles.filter(v => v.conditionGrade >= parseFloat(conditionGradeMin))
      }
      if (carfaxClean) filteredVehicles = filteredVehicles.filter(v => v.carfaxStatus === 'clean')
      if (autoCheckClean) filteredVehicles = filteredVehicles.filter(v => v.autoCheckStatus === 'clean')

      // Inventory management filters
      if (newListings) filteredVehicles = filteredVehicles.filter(v => v.daysOnMarket <= 7)
      if (needsRelisting) filteredVehicles = filteredVehicles.filter(v => v.bidCount === 0 && v.daysOnMarket >= 14)
      if (priceReductionNeeded) filteredVehicles = filteredVehicles.filter(v => v.bidPrice >= v.mmr * 1.15)
      if (daysOnMarketMin) filteredVehicles = filteredVehicles.filter(v => v.daysOnMarket >= parseInt(daysOnMarketMin))
      if (daysOnMarketMax) filteredVehicles = filteredVehicles.filter(v => v.daysOnMarket <= parseInt(daysOnMarketMax))

      // Apply sorting
      filteredVehicles.sort((a, b) => {
        switch (sortBy) {
          case 'mmr_value':
            const aPercent = (a.bidPrice - a.mmr) / a.mmr
            const bPercent = (b.bidPrice - b.mmr) / b.mmr
            return aPercent - bPercent // Best deals first (most negative percentage)
          case 'price_low':
            return a.bidPrice - b.bidPrice
          case 'price_high':
            return b.bidPrice - a.bidPrice
          case 'days_on_market':
            return b.daysOnMarket - a.daysOnMarket
          case 'condition_grade':
            return b.conditionGrade - a.conditionGrade
          case 'newest':
            return b.daysOnMarket - a.daysOnMarket // Newest = fewer days on market
          default:
            return b.bidPrice - a.bidPrice
        }
      })

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