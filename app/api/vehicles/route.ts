import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

// Mock data as fallback
const mockVehicles = [
  {
    id: "OVE.BCAA.399641951",
    make: "Toyota",
    models: ["Camry"],
    year: "2021",
    bodyStyle: "Sedan",
    odometer: 25000,
    bidPrice: 18500,
    buyNowPrice: 22000,
    buyable: true,
    atAuction: false,
    auctionEndTime: "2025-06-15T18:00:00Z",
    exteriorColor: "White",
    locationCity: "Dallas",
    locationZipcode: "75201",
    titleBrandings: ["Clean"],
    salvageVehicle: false,
    statuses: ["Live"],
    vin: "4T1G11AK1LU123455",
    conditionGradeNumeric: 3.5,
  },
  {
    id: "OVE.BCAA.399641952",
    make: "Honda",
    models: ["Accord"],
    year: "2020",
    bodyStyle: "Sedan",
    odometer: 32000,
    bidPrice: 17200,
    buyNowPrice: 20500,
    buyable: true,
    atAuction: false,
    auctionEndTime: "2025-06-15T18:00:00Z",
    exteriorColor: "Silver",
    locationCity: "Los Angeles",
    locationZipcode: "90210",
    titleBrandings: ["Clean"],
    salvageVehicle: false,
    statuses: ["Live"],
    vin: "4T1G11AK1LU123456",
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
    const sortBy = searchParams.get('sortBy') || 'composite_score'

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

    // Condition filters
    const conditionGradeMin = searchParams.get('conditionGradeMin') || ''
    const conditionGradeMax = searchParams.get('conditionGradeMax') || ''
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

    // Condition filters
    if (conditionGradeMin) {
      query.conditionGradeNumeric = { $gte: parseFloat(conditionGradeMin) }
    }
    if (conditionGradeMax) {
      query.conditionGradeNumeric = { ...query.conditionGradeNumeric, $lte: parseFloat(conditionGradeMax) }
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
      // Vehicles that have been on market for a long time (indicating pricing issues)
      query.daysOnMarket = { $gte: 20 }
    }

    if (daysOnMarketMin || daysOnMarketMax) {
      query.daysOnMarket = {}
      if (daysOnMarketMin) query.daysOnMarket.$gte = parseInt(daysOnMarketMin)
      if (daysOnMarketMax) query.daysOnMarket.$lte = parseInt(daysOnMarketMax)
    }

    // Build sort criteria
    let useAggregationSort = false
    let aggregationSortCriteria: any = {}
    
    switch (sortBy) {
      case 'mmr_difference':
        useAggregationSort = true
        aggregationSortCriteria = { mmrDifference: -1 } // High to low
        break
      case 'mmr_difference_low':
        useAggregationSort = true
        aggregationSortCriteria = { mmrDifference: 1 } // Low to high
        break
      case 'condition_grade_high':
        useAggregationSort = true
        aggregationSortCriteria = { conditionGradeNumeric: -1 } // High to low
        break
      case 'condition_grade_low':
        useAggregationSort = true
        aggregationSortCriteria = { conditionGradeNumeric: 1 } // Low to high
        break
      case 'composite_score':
        useAggregationSort = true
        aggregationSortCriteria = { compositeScore: -1 } // High to low
        break
      default:
        useAggregationSort = true
        aggregationSortCriteria = { compositeScore: -1 } // Default to composite score high to low
    }

    try {
      // Connect to MongoDB
      const { db } = await connectToDatabase()
      const collection = db.collection('manheim_car_data')

      // Build aggregation pipeline
      let pipeline: any[] = [{ $match: query }]

      // Add MMR difference calculation
      pipeline.push({
        $addFields: {
          mmrDifference: {
            $cond: {
              if: { $and: [{ $ne: ["$buyNowPrice", null] }, { $ne: ["$mmrPrice", null] }] },
              then: { $subtract: ["$buyNowPrice", "$mmrPrice"] },
              else: 0
            }
          }
        }
      })

      // Add composite score calculation if needed
      if (sortBy === 'composite_score') {
        pipeline.push({
          $addFields: {
            compositeScore: {
              $add: [
                // Invert MMR difference so negative differences (good deals) become positive scores
                // Divide by 1000 to normalize the scale
                { 
                  $cond: {
                    if: { $ne: ["$mmrDifference", null] },
                    then: { $divide: [{ $multiply: ["$mmrDifference", -1] }, 1000] },
                    else: 0
                  }
                },
                // Add condition grade (already on 1-5 scale)
                { 
                  $cond: {
                    if: { $ne: ["$conditionGradeNumeric", null] },
                    then: "$conditionGradeNumeric",
                    else: 0
                  }
                }
              ]
            }
          }
        })
      }

      // Add sorting - always add sort criteria
      pipeline.push({ $sort: aggregationSortCriteria })

      // Execute optimized aggregation
      const [vehicles, totalCountResult] = await Promise.all([
        collection.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]).toArray(),
        collection.aggregate([...pipeline, { $count: "total" }]).toArray()
      ])

      const totalCount = totalCountResult[0]?.total || 0

      // Get filter options only if needed (when no specific filters are applied)
      let filterOptions = {
        makes: [] as string[],
        bodyStyles: [] as string[],
        locations: [] as string[]
      }

      if (!search && !make && !bodyStyle && !location) {
        const [makes, bodyStyles, locations] = await Promise.all([
          collection.distinct('make', {}),
          collection.distinct('bodyStyle', {}),
          collection.distinct('locationCity', {})
        ])
        
        filterOptions = {
          makes: makes.filter(Boolean).sort(),
          bodyStyles: bodyStyles.filter(Boolean).sort(),
          locations: locations.filter(Boolean).sort()
        }
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

        const bidPriceValue = vehicle.bidPrice || 0
        const buyNowPriceValue = vehicle.buyNowPrice || null
        
        // Calculate MMR difference (buyNowPrice - mmrPrice)
        const mmrPrice = vehicle.mmrPrice || null
        const mmrDifference = (buyNowPriceValue && mmrPrice) ? buyNowPriceValue - mmrPrice : (vehicle.mmrDifference || 0)

        // Extract status from statuses array at index 0
        const status = vehicle.statuses && vehicle.statuses.length > 0 ? vehicle.statuses[0] : 'Unknown'
        
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
          buyNowPrice: buyNowPriceValue,
          buyable: vehicle.buyable || false,
          atAuction: vehicle.atAuction || false,
          auctionEndTime: vehicle.auctionEndTime,
          auctionStartTime: vehicle.auctionStartTime,
          salvage: vehicle.salvage || vehicle.salvageVehicle || false,
          vin: vehicle.vin,
          mmrDifference: mmrDifference, // Add calculated MMR difference
          mmrValue: mmrPrice, // Add MMR value
          conditionGrade: parseFloat(conditionGrade),
          carfaxStatus,
          autoCheckStatus: vehicle.autoCheckStatus || carfaxStatus,
          daysOnMarket,
          viewCount,
          bidCount,
          listingStatus: vehicle.listingStatus || 'active',
          lastPriceUpdate: vehicle.lastPriceUpdate || new Date().toISOString(),
          sellerName: vehicle.sellerName || 'Unknown Seller',
          mComVdpUrl: `https://www.manheim.com/listings/vehicles/details?listingId=${vehicle._id?.toString() || vehicle.id}`,
          status: status
        }
      })

      console.log(`Found ${transformedVehicles.length} vehicles from MongoDB (page ${page}, total: ${totalCount}, sort: ${sortBy})`)
      
      // Debug: Log first vehicle's MMR difference data
      if (transformedVehicles.length > 0) {
        const firstVehicle = transformedVehicles[0]
        console.log(`Sample vehicle MMR data: buyNowPrice=${firstVehicle.buyNowPrice}, mmrDifference=${firstVehicle.mmrDifference}`)
      }

      const response = NextResponse.json({
        vehicles: transformedVehicles,
        total: totalCount,
        page,
        totalPages: Math.ceil(totalCount / limit),
        filterOptions
      })

      // Add caching headers for better performance
      response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
      
      return response

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
          bidPrice: 16500,
          buyNowPrice: 19000,
          buyable: true,
          atAuction: true,
          salvage: false,
          mmrPrice: 18500,
          mmrDifference: 500, // 19000 - 18500
          mmrValue: 18500, // Add MMR value for consistency
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
          bidPrice: 19500,
          buyNowPrice: 22000,
          buyable: true,
          atAuction: false,
          salvage: false,
          mmrPrice: 18800,
          mmrDifference: 3200, // 22000 - 18800
          mmrValue: 18800, // Add MMR value for consistency
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
          bidPrice: 22000,
          buyNowPrice: 25000,
          buyable: false,
          atAuction: true,
          salvage: true,
          mmrPrice: 23000,
          mmrDifference: 2000, // 25000 - 23000
          mmrValue: 23000, // Add MMR value for consistency
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
          bidPrice: 18500,
          buyNowPrice: 21000,
          buyable: true,
          atAuction: true,
          salvage: false,
          mmrPrice: 19500,
          mmrDifference: 1500, // 21000 - 19500
          mmrValue: 19500, // Add MMR value for consistency
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
          bidPrice: 27500,
          buyNowPrice: 30000,
          buyable: true,
          atAuction: false,
          salvage: false,
          mmrPrice: 26500,
          mmrDifference: 3500, // 30000 - 26500
          mmrValue: 26500, // Add MMR value for consistency
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
          bidPrice: 36000,
          buyNowPrice: 38000,
          buyable: true,
          atAuction: true,
          salvage: false,
          mmrPrice: 37000,
          mmrDifference: 1000, // 38000 - 37000
          mmrValue: 37000, // Add MMR value for consistency
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
      let filteredVehicles = mockVehicles.filter(vehicle => {
        if (make && !vehicle.make.toLowerCase().includes(make.toLowerCase())) return false
        if (bodyStyle && !vehicle.bodyStyle.toLowerCase().includes(bodyStyle.toLowerCase())) return false
        if (yearMin && vehicle.year < parseInt(yearMin)) return false
        if (yearMax && vehicle.year > parseInt(yearMax)) return false
        if (location && !vehicle.locationCity.toLowerCase().includes(location.toLowerCase())) return false
        if (salvageOnly) return vehicle.salvage
        if (priceReductionNeeded && vehicle.daysOnMarket < 20) return false
        if (daysOnMarketMin && vehicle.daysOnMarket < parseInt(daysOnMarketMin)) return false
        if (daysOnMarketMax && vehicle.daysOnMarket > parseInt(daysOnMarketMax)) return false
        if (conditionGradeMin && vehicle.conditionGrade < parseFloat(conditionGradeMin)) return false
        if (conditionGradeMax && vehicle.conditionGrade > parseFloat(conditionGradeMax)) return false
        return true
      })

      // Apply sorting
      filteredVehicles.sort((a, b) => {
        switch (sortBy) {
          case 'mmr_difference':
            return (b.mmrDifference || 0) - (a.mmrDifference || 0) // Highest difference first
          case 'mmr_difference_low':
            return (a.mmrDifference || 0) - (b.mmrDifference || 0) // Lowest difference first
          case 'condition_grade_high':
            return (b.conditionGrade || 0) - (a.conditionGrade || 0) // Highest grade first
          case 'condition_grade_low':
            return (a.conditionGrade || 0) - (b.conditionGrade || 0) // Lowest grade first
          case 'price_low':
            return a.bidPrice - b.bidPrice
          case 'price_high':
            return b.bidPrice - a.bidPrice
          case 'days_on_market':
            return b.daysOnMarket - a.daysOnMarket
          case 'newest':
            return b.daysOnMarket - a.daysOnMarket // Newest = fewer days on market
          case 'composite_score':
            // Calculate composite scores for both vehicles
            // Invert MMR difference so negative differences (good deals) become positive scores
            const scoreA = (a.mmrDifference !== null ? (-a.mmrDifference / 1000) : 0) + (a.conditionGrade || 0)
            const scoreB = (b.mmrDifference !== null ? (-b.mmrDifference / 1000) : 0) + (b.conditionGrade || 0)
            return scoreB - scoreA // Highest composite score first
          default:
            // Default to composite score (best deals)
            const defaultScoreA = (a.mmrDifference !== null ? (-a.mmrDifference / 1000) : 0) + (a.conditionGrade || 0)
            const defaultScoreB = (b.mmrDifference !== null ? (-b.mmrDifference / 1000) : 0) + (b.conditionGrade || 0)
            return defaultScoreB - defaultScoreA // Highest composite score first
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

      const response = NextResponse.json({
        vehicles: paginatedMockVehicles,
        total: totalMockCount,
        page,
        totalPages: Math.ceil(totalMockCount / limit),
        filterOptions: mockFilterOptions
      })

      // Add caching headers for better performance
      response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
      
      return response
    }

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' },
      { status: 500 }
    )
  }
} 