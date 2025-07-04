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

    // New intelligent filters
    const sellerTypes = searchParams.get('sellerTypes')?.split(',').filter(Boolean) || []
    const mmrDifferenceMin = searchParams.get('mmrDifferenceMin') || ''
    const auctionEndingSoon = searchParams.get('auctionEndingSoon') === 'true'
    const lowMileageOnly = searchParams.get('lowMileageOnly') === 'true'
    const highValueOnly = searchParams.get('highValueOnly') === 'true'
    const recentListings = searchParams.get('recentListings') === 'true'
    const pickupRegion = searchParams.get('pickupRegion') || ''
    const exteriorColor = searchParams.get('exteriorColor') || ''
    const daysOnMarketMax = searchParams.get('daysOnMarketMax') || ''

    // Legacy inventory management filters (kept for compatibility)
    const newListings = searchParams.get('newListings') === 'true'
    const needsRelisting = searchParams.get('needsRelisting') === 'true'
    const priceReductionNeeded = searchParams.get('priceReductionNeeded') === 'true'
    const daysOnMarketMin = searchParams.get('daysOnMarketMin') || ''

    // Removed specificCriteriaOnly filter

    // Build MongoDB query
    const query: any = {}

    // Removed specificCriteriaOnly filter logic

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
      const priceConditions = []
      if (priceMin) priceConditions.push({ 
        $gte: [
          { 
            $convert: { 
              input: "$bidPrice", 
              to: "double", 
              onError: 0, 
              onNull: 0 
            } 
          }, 
          parseInt(priceMin)
        ] 
      })
      if (priceMax) priceConditions.push({ 
        $lte: [
          { 
            $convert: { 
              input: "$bidPrice", 
              to: "double", 
              onError: 0, 
              onNull: 0 
            } 
          }, 
          parseInt(priceMax)
        ] 
      })
      
      if (query.$expr) {
        // If $expr already exists, combine with $and
        query.$expr = { $and: [query.$expr, ...priceConditions] }
      } else {
        query.$expr = priceConditions.length === 1 ? priceConditions[0] : { $and: priceConditions }
      }
    }
    if (mileageMax) {
      const mileageCondition = { 
        $lte: [
          { 
            $convert: { 
              input: "$odometer", 
              to: "double", 
              onError: 0, 
              onNull: 0 
            } 
          }, 
          parseInt(mileageMax)
        ] 
      }
      
      if (query.$expr) {
        // If $expr already exists, combine with $and
        query.$expr = { $and: [query.$expr, mileageCondition] }
      } else {
        query.$expr = mileageCondition
      }
    }
    if (location) query.locationCity = { $regex: `^${location}$`, $options: 'i' }
    
    // Salvage filtering - exclude salvage vehicles by default unless specifically requested
    if (salvageOnly) {
      query.salvage = true
    } else {
      // By default, exclude salvage vehicles
      query.$and = query.$and || []
      query.$and.push({
        $or: [
          { salvage: { $ne: true } },
          { salvage: { $exists: false } },
          { salvageVehicle: { $ne: true } },
          { salvageVehicle: { $exists: false } }
        ]
      })
    }
    
    if (buyNowOnly) query.buyable = true
    if (auctionOnly) query.atAuction = true

    // Condition filters
    if (conditionGradeMin) {
      const conditionMinCondition = { 
        $gte: [
          { 
            $convert: { 
              input: "$conditionGradeNumeric", 
              to: "double", 
              onError: 0, 
              onNull: 0 
            } 
          }, 
          parseFloat(conditionGradeMin)
        ] 
      }
      
      if (query.$expr) {
        query.$expr = { $and: [query.$expr, conditionMinCondition] }
      } else {
        query.$expr = conditionMinCondition
      }
    }
    if (conditionGradeMax) {
      const conditionMaxCondition = { 
        $lte: [
          { 
            $convert: { 
              input: "$conditionGradeNumeric", 
              to: "double", 
              onError: 0, 
              onNull: 0 
            } 
          }, 
          parseFloat(conditionGradeMax)
        ] 
      }
      
      if (query.$expr) {
        query.$expr = { $and: [query.$expr, conditionMaxCondition] }
      } else {
        query.$expr = conditionMaxCondition
      }
    }
    if (carfaxClean) {
      query.carfaxStatus = 'clean'
    }
    if (autoCheckClean) {
      query.autoCheckStatus = 'clean'
    }

    // New intelligent filters
    if (sellerTypes.length > 0) {
      query.sellerName = { $in: sellerTypes }
    }
    
    if (mmrDifferenceMin) {
      // MMR difference is calculated as mmrPrice - buyNowPrice, so positive means good deal
      const mmrDiffCondition = {
        $gte: [
          {
            $subtract: [
              { $convert: { input: "$mmrPrice", to: "double", onError: 0, onNull: 0 } },
              { $convert: { input: "$buyNowPrice", to: "double", onError: 0, onNull: 0 } }
            ]
          },
          parseInt(mmrDifferenceMin)
        ]
      }
      
      if (query.$expr) {
        query.$expr = { $and: [query.$expr, mmrDiffCondition] }
      } else {
        query.$expr = mmrDiffCondition
      }
    }
    
    if (auctionEndingSoon) {
      // Auctions ending within 24 hours
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      query.auctionEndTime = { $lte: tomorrow.toISOString() }
    }
    
    if (lowMileageOnly) {
      query.odometer = { $lt: 30000 }
    }
    
    if (highValueOnly) {
      const highValueCondition = {
        $gte: [
          { $convert: { input: "$mmrPrice", to: "double", onError: 0, onNull: 0 } },
          15000
        ]
      }
      
      if (query.$expr) {
        query.$expr = { $and: [query.$expr, highValueCondition] }
      } else {
        query.$expr = highValueCondition
      }
    }
    
    if (recentListings) {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      query.importedAt = { $gte: sevenDaysAgo }
    }
    
    if (pickupRegion) {
      query.pickupRegion = { $regex: `^${pickupRegion}$`, $options: 'i' }
    }
    
    if (exteriorColor) {
      query.exteriorColor = { $regex: exteriorColor, $options: 'i' }
    }
    
    if (daysOnMarketMax) {
      query.daysOnMarket = { ...(query.daysOnMarket || {}), $lte: parseInt(daysOnMarketMax) }
    }

    // Legacy inventory management filters
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
      const collection = db.collection('updated_car_data')

      // Use simple find instead of aggregation to avoid conversion errors
      let allVehicles = await collection.find(query).toArray()
      
      // Apply JavaScript-based sorting since we removed MongoDB aggregation
      allVehicles.sort((a, b) => {
        switch (sortBy) {
          case 'mmr_difference': {
            const aDiff = (parseFloat(a.mmrPrice) || 0) - (parseFloat(a.buyNowPrice) || 0)
            const bDiff = (parseFloat(b.mmrPrice) || 0) - (parseFloat(b.buyNowPrice) || 0)
            return bDiff - aDiff // High to low
          }
          case 'mmr_difference_low': {
            const aDiff = (parseFloat(a.mmrPrice) || 0) - (parseFloat(a.buyNowPrice) || 0)
            const bDiff = (parseFloat(b.mmrPrice) || 0) - (parseFloat(b.buyNowPrice) || 0)
            return aDiff - bDiff // Low to high
          }
          case 'condition_grade_high': {
            const aGrade = parseFloat(a.conditionGradeNumeric) || 0
            const bGrade = parseFloat(b.conditionGradeNumeric) || 0
            return bGrade - aGrade // High to low
          }
          case 'condition_grade_low': {
            const aGrade = parseFloat(a.conditionGradeNumeric) || 0
            const bGrade = parseFloat(b.conditionGradeNumeric) || 0
            return aGrade - bGrade // Low to high
          }
          case 'composite_score':
          default: {
            // Calculate composite score for each vehicle
            const calculateCompositeScore = (vehicle: any) => {
              const mmrDiff = (parseFloat(vehicle.mmrPrice) || 0) - (parseFloat(vehicle.buyNowPrice) || 0)
              const conditionGrade = parseFloat(vehicle.conditionGradeNumeric) || 0
              return (mmrDiff / 1000) + (6 - conditionGrade)
            }
            const aScore = calculateCompositeScore(a)
            const bScore = calculateCompositeScore(b)
            return bScore - aScore // High to low
          }
        }
      })
      
      const totalCount = allVehicles.length
      const vehicles = allVehicles.slice(skip, skip + limit)

      // totalCount is now directly available from the Promise.all result above

      // Get filter options only if needed (when no specific filters are applied)
      let filterOptions = {
        makes: [] as string[],
        bodyStyles: [] as string[],
        locations: [] as string[],
        pickupRegions: [] as string[],
        exteriorColors: [] as string[]
      }

      if (!search && !make && !bodyStyle && !location) {
        const [makes, bodyStyles, locations, pickupRegions, exteriorColors] = await Promise.all([
          collection.distinct('make', {}),
          collection.distinct('bodyStyle', {}),
          collection.distinct('locationCity', {}),
          collection.distinct('pickupRegion', {}),
          collection.distinct('exteriorColor', {})
        ])
        
        filterOptions = {
          makes: makes.filter(Boolean).sort(),
          bodyStyles: bodyStyles.filter(Boolean).sort(),
          locations: locations.filter(Boolean).sort(),
          pickupRegions: pickupRegions.filter(Boolean).sort(),
          exteriorColors: exteriorColors.filter(Boolean).sort()
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
        
        // Calculate MMR difference (mmrPrice - buyNowPrice, positive = good deal)
        const mmrPrice = vehicle.mmrPrice || null
        const mmrDifference = (buyNowPriceValue && mmrPrice) ? mmrPrice - buyNowPriceValue : (vehicle.mmrDifference || 0)

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
          conditionGradeNumeric: vehicle.conditionGradeNumeric || parseFloat(conditionGrade),
          carfaxStatus,
          autoCheckStatus: vehicle.autoCheckStatus || carfaxStatus,
          daysOnMarket,
          viewCount,
          bidCount,
          listingStatus: vehicle.listingStatus || 'active',
          lastPriceUpdate: vehicle.lastPriceUpdate || new Date().toISOString(),
          sellerName: vehicle.sellerName || 'Unknown Seller',
          mComVdpUrl: vehicle.mComVdpUrl || null,
          status: status,
          conditionReportUrl: vehicle.conditionReportUrl || null,
          vinUrl: vehicle.vinUrl || null,
          images: vehicle.images || [] // Add images field
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
          salvageVehicle: false,
          hasFrameDamage: false,
          asIs: false,
          odometerCheckOK: true,
          titleAndProblemCheckOK: true,
          previouslyCanadianListing: false,
          mmrPrice: 18500,
          mmrDifference: -500, // 18500 - 19000 (negative means MMR < buyNow, bad deal)
          mmrValue: 18500, // Add MMR value for consistency
          vin: '1HGBH41JXMN109186',
          conditionGrade: 3.8,
          carfaxStatus: 'clean',
          autoCheckStatus: 'clean',
          daysOnMarket: 5,
          viewCount: 45,
          bidCount: 3,
          listingStatus: 'active',
          lastPriceUpdate: '2024-01-10T10:00:00Z',
          conditionReportUrl: 'https://inspectionreport.manheim.com/?CLIENT=SIMUC&channel=OVE&disclosureid=1&listingID=1',
          mComVdpUrl: 'https://search.manheim.com/results#/details/1HGBH41JXMN109186/OVE',
          vinUrl: 'https://www.carfax.com/VehicleHistory/p/Report.cfx?partner=DLR_3&vin=1HGBH41JXMN109186',
          images: [
            {
              largeUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
              smallUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
              description: 'Front view',
              sequence: 1
            }
          ]
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
          salvageVehicle: false,
          hasFrameDamage: false,
          asIs: false,
          odometerCheckOK: true,
          titleAndProblemCheckOK: true,
          previouslyCanadianListing: false,
          mmrPrice: 26000,
          mmrDifference: 4000, // 26000 - 22000 (positive means MMR > buyNow, GOOD deal!)
          mmrValue: 26000, // Add MMR value for consistency
          vin: '2HGFC2F59JH542123',
          conditionGrade: 4.1,
          carfaxStatus: 'clean',
          autoCheckStatus: 'clean',
          daysOnMarket: 22,
          viewCount: 12,
          bidCount: 0,
          listingStatus: 'needs_relisting',
          lastPriceUpdate: '2024-01-05T14:30:00Z',
          conditionReportUrl: 'https://inspectionreport.manheim.com/?CLIENT=SIMUC&channel=OVE&disclosureid=2&listingID=2',
          mComVdpUrl: 'https://search.manheim.com/results#/details/2HGFC2F59JH542123/OVE',
          vinUrl: 'https://www.carfax.com/VehicleHistory/p/Report.cfx?partner=DLR_3&vin=2HGFC2F59JH542123'
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
          salvageVehicle: true, // This vehicle would be EXCLUDED from qualified criteria
          hasFrameDamage: true, // This vehicle would be EXCLUDED 
          asIs: true, // This vehicle would be EXCLUDED
          odometerCheckOK: false, // This vehicle would be EXCLUDED
          titleAndProblemCheckOK: false, // This vehicle would be EXCLUDED
          previouslyCanadianListing: true, // This vehicle would be EXCLUDED
          mmrPrice: 23000,
          mmrDifference: -2000, // 23000 - 25000 (negative means MMR < buyNow, bad deal)
          mmrValue: 23000, // Add MMR value for consistency
          vin: '1FTEW1EP5JFA12345',
          conditionGrade: 2.5,
          carfaxStatus: 'issues',
          autoCheckStatus: 'issues',
          daysOnMarket: 8,
          viewCount: 67,
          bidCount: 5,
          listingStatus: 'active',
          lastPriceUpdate: '2024-01-12T09:15:00Z',
          conditionReportUrl: 'https://inspectionreport.manheim.com/?CLIENT=SIMUC&channel=OVE&disclosureid=3&listingID=3',
          mComVdpUrl: 'https://search.manheim.com/results#/details/1FTEW1EP5JFA12345/OVE'
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
          salvageVehicle: false,
          hasFrameDamage: false,
          asIs: false,
          odometerCheckOK: true,
          titleAndProblemCheckOK: true,
          previouslyCanadianListing: false,
          mmrPrice: 19500,
          mmrDifference: 1500, // 21000 - 19500 (positive means MMR > buyNow, good deal)
          mmrValue: 19500, // Add MMR value for consistency
          vin: '1G1ZD5ST5MF123456',
          conditionGrade: 4.3,
          carfaxStatus: 'clean',
          autoCheckStatus: 'clean',
          daysOnMarket: 2,
          viewCount: 89,
          bidCount: 8,
          listingStatus: 'hot',
          lastPriceUpdate: '2024-01-15T16:45:00Z',
          conditionReportUrl: 'https://inspectionreport.manheim.com/?CLIENT=SIMUC&channel=OVE&disclosureid=4&listingID=4',
          mComVdpUrl: 'https://search.manheim.com/results#/details/1G1ZD5ST5MF123456/OVE'
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
          salvageVehicle: false,
          hasFrameDamage: false,
          asIs: false,
          odometerCheckOK: true,
          titleAndProblemCheckOK: true,
          previouslyCanadianListing: false,
          mmrPrice: 26500,
          mmrDifference: 3500, // 30000 - 26500 (positive means MMR > buyNow, good deal)
          mmrValue: 26500, // Add MMR value for consistency
          vin: 'WBA8E9G59HNU12345',
          conditionGrade: 3.9,
          carfaxStatus: 'clean',
          autoCheckStatus: 'clean',
          daysOnMarket: 18,
          viewCount: 23,
          bidCount: 1,
          listingStatus: 'price_reduction_needed',
          lastPriceUpdate: '2024-01-08T11:20:00Z',
          conditionReportUrl: 'https://inspectionreport.manheim.com/?CLIENT=SIMUC&channel=OVE&disclosureid=5&listingID=5',
          mComVdpUrl: 'https://search.manheim.com/results#/details/WBA8E9G59HNU12345/OVE'
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
          salvageVehicle: false,
          hasFrameDamage: false,
          asIs: false,
          odometerCheckOK: true,
          titleAndProblemCheckOK: true,
          previouslyCanadianListing: false,
          mmrPrice: 37000,
          mmrDifference: 1000, // 38000 - 37000 (positive means MMR > buyNow, good deal)
          mmrValue: 37000, // Add MMR value for consistency
          vin: '5YJ3E1EA4NF123456',
          conditionGrade: 4.5,
          carfaxStatus: 'clean',
          autoCheckStatus: 'clean',
          daysOnMarket: 1,
          viewCount: 156,
          bidCount: 12,
          listingStatus: 'new_listing',
          lastPriceUpdate: '2024-01-16T08:00:00Z',
          conditionReportUrl: 'https://inspectionreport.manheim.com/?CLIENT=SIMUC&channel=OVE&disclosureid=6&listingID=6',
          mComVdpUrl: 'https://search.manheim.com/results#/details/5YJ3E1EA4NF123456/OVE'
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
            return (a.mmrDifference || 0) - (b.mmrDifference || 0) // Most negative (best deals) first
          case 'mmr_difference_low':
            return (b.mmrDifference || 0) - (a.mmrDifference || 0) // Least negative (worst deals) first
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
            // More negative MMR difference = better deal (buyNowPrice - mmrPrice < 0 is good)
            // Lower condition grade = better deal (worse condition = lower price = better value)
            const scoreA = (a.mmrDifference !== null ? (-a.mmrDifference / 1000) : 0) + (6 - (a.conditionGrade || 0))
            const scoreB = (b.mmrDifference !== null ? (-b.mmrDifference / 1000) : 0) + (6 - (b.conditionGrade || 0))
            return scoreB - scoreA // Highest composite score first
          default:
            // Default to composite score (best deals)
            // More negative MMR difference = better deal, lower condition grade = better deal
            const defaultScoreA = (a.mmrDifference !== null ? (-a.mmrDifference / 1000) : 0) + (6 - (a.conditionGrade || 0))
            const defaultScoreB = (b.mmrDifference !== null ? (-b.mmrDifference / 1000) : 0) + (6 - (b.conditionGrade || 0))
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