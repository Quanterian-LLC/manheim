import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import * as https from 'https'
import * as querystring from 'querystring'

// MongoDB configuration - Production
const MONGO_URL = 'mongodb+srv://quanterian:trvPE8ATKOkhljg1@cluster0.wfoalju.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DATABASE_NAME = 'manheim';
const COLLECTION_NAME = 'updated_car_data';

// API configuration
const MAX_RECORDS = 3000;
const BATCH_SIZE = 1000;

// Manheim API credentials (Base64 encoded)
const MANHEIM_AUTH = 'ZGJ4N25qbXZmNzN2ZGo5bmtrYXg2OWU5OnJ1VTViSHZ2WXY=';

// State chunks for API calls
const STATE_CHUNKS = [
  ["CA", "TX", "FL", "NY", "IL"],
  ["GA", "NC", "PA", "OH", "MI"],
  ["VA", "NJ", "WA", "AZ", "MA"],
  ["IN", "TN", "MO", "WI", "CO"],
  ["MN", "SC", "AL", "LA", "KY"],
  ["OK", "OR", "CT", "IA", "MS"],
  ["AR", "KS", "UT", "NV", "NM"],
  ["WV", "NE", "ID", "ME", "HI"],
  ["NH", "RI", "MT", "DE", "SD"],
  ["ND", "VT", "WY"]
];

// Default seller types (can be overridden by request)
const DEFAULT_SELLER_TYPES = [
  "Auction", "Bank", "Captive Finance", "Car Rental",
  "Credit Union", "Independent", "Franchise", "Fleet/Lease", "Finance", "Lease"
];

// Generate Manheim access token
async function generateManheimAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify({
      'grant_type': 'client_credentials',
      'scope': 'search:buyer-seller'
    });

    const options = {
      hostname: 'api.manheim.com',
      path: '/oauth2/token.oauth2',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${MANHEIM_AUTH}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res: any) => {
      let data = '';
      res.on('data', (chunk: any) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.access_token) {
            console.log('✅ Successfully obtained access token');
            resolve(response.access_token);
          } else {
            console.error('❌ No access token in response:', response);
            reject(new Error('Failed to get access token'));
          }
        } catch (error) {
          console.error('❌ Error parsing token response:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error: any) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Fetch exterior colors mapping
async function fetchExteriorColors(accessToken: string): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.manheim.com',
      path: '/search/taxonomy/exteriorColors',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res: any) => {
      let data = '';
      res.on('data', (chunk: any) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          const colorMap: Record<string, string> = {};
          if (response.items && Array.isArray(response.items)) {
            response.items.forEach((color: any) => {
              if (color.id && color.name) {
                colorMap[String(color.id)] = color.name;
              }
            });
          }
          console.log(`✅ Loaded ${Object.keys(colorMap).length} exterior colors`);
          resolve(colorMap);
        } catch (error) {
          console.error('❌ Error parsing colors response:', error);
          resolve({});
        }
      });
    });

    req.on('error', (error: any) => {
      console.error('❌ Colors request error:', error);
      resolve({});
    });

    req.end();
  });
}

// Search Manheim vehicles with dynamic seller types
async function searchVehicles(accessToken: string, stateChunk: string[], sellerTypes: string[] = DEFAULT_SELLER_TYPES, start: number = 0, limit: number = 1000): Promise<any> {
  return new Promise((resolve, reject) => {
    const payload = {
      executeNow: true,
      includeFacets: false,
      firstTimeListed: true,
      includeFilters: false,
      sellerTypes: sellerTypes, // Dynamic seller types
      hasFrameDamage: false,
      startBuyNowPrice: 1,
      pickupLocationStates: stateChunk,
      odometerCheckOK: true,
      asIs: false,
      previouslyCanadianListing: false,
      salvageVehicle: false,
      titleAndProblemCheckOK: true,
      fields: [
        "sources", "saleDate", "vin", "year", "make", "models", "trims", "bodyType", "exteriorColorIds",
        "odometer", "buyNowPrice", "mmrPrice", "conditionGradeNumeric", "conditionReportUrl", "comments",
        "announcements", "additionalAnnouncements", "images", "sellerName", "pickupLocationCity", "pickupLocationState", 
        "pickupLocationZipcode", "pickupRegion", "auctionStartTime", "auctionEndTime"
      ],
      limit: limit,
      start: start
    };

    const postData = JSON.stringify(payload);

    const options = {
      hostname: 'api.manheim.com',
      path: '/searches',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res: any) => {
      let data = '';
      res.on('data', (chunk: any) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          console.error('❌ Error parsing search response:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error: any) => {
      console.error('❌ Search request error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Convert UTC time to Dallas time
function convertToDallasTime(utcTimeString: string): string {
  if (!utcTimeString) return '';
  
  try {
    const datePart = utcTimeString.substring(0, 10);
    const timePart = utcTimeString.substring(11, 19);
    const isoString = `${datePart}T${timePart}Z`;
    const utcDate = new Date(isoString);
    const dallasOffsetMs = -5 * 60 * 60 * 1000; // CDT is UTC-5
    const dallasDate = new Date(utcDate.getTime() + dallasOffsetMs);
    
    return dallasDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return '';
  }
}

// Process and format vehicle data
function processVehicleData(item: any, colorMap: Record<string, string>) {
  const newPrice = parseFloat(item.buyNowPrice) || 0;
  const mmrPrice = parseFloat(item.mmrPrice) || 0;
  
  return {
    id: item.vin || `vehicle_${Date.now()}_${Math.random()}`,
    source: item.source || '',
    saleDate: item.saleDate || '',
    vin: item.vin || '',
    vinUrl: item.vin ? `https://www.ove.com/search/results#/details/${item.vin}/OVE` : '',
    year: item.year || '',
    make: item.make || '',
    models: item.models || [],
    model: (item.models && item.models[0]) || '',
    trims: item.trims || [],
    bodyStyle: item.bodyType || '',
    exteriorColor: (item.exteriorColorIds || []).map((id: any) => colorMap[id] || '').join(', '),
    odometer: item.odometer || 0,
    bidPrice: newPrice, // Using buyNowPrice as bidPrice for consistency
    buyNowPrice: newPrice,
    buyable: true,
    atAuction: false,
    mmrPrice: mmrPrice,
    mmrValue: mmrPrice,
    mmrDifference: mmrPrice ? (mmrPrice - newPrice) : 0,
    buyMinusMMR: mmrPrice ? (newPrice - mmrPrice) : 0,
    conditionGradeNumeric: item.conditionGradeNumeric || 0,
    conditionReportUrl: item.conditionReportUrl || '',
    comments: item.comments || '',
    announcements: item.announcements || '',
    additionalAnnouncements: item.additionalAnnouncements || '',
    images: (item.images || []).map((img: any) => {
      if (typeof img === 'string') return img;
      if (img && img.url) return img.url;
      if (img && img.href) return img.href;
      if (img && img.src) return img.src;
      return img;
    }),
    sellerName: item.sellerName || '',
    locationCity: item.pickupLocationCity || '',
    locationState: item.pickupLocationState || '',
    locationZipcode: item.pickupLocationZipcode || '',
    pickupRegion: item.pickupRegion || '',
    auctionStartTime: item.auctionStartTime || '',
    auctionEndTime: item.auctionEndTime || '',
    dallasTime: convertToDallasTime(item.auctionStartTime),
    titleBrandings: item.titleBrandings || ["Clean"], // Use actual title brandings
    salvageVehicle: item.salvageVehicle || false, // Use actual salvage status
    salvage: item.salvageVehicle || item.salvage || false, // Use actual salvage status
    statuses: item.statuses || ["Live"], // Use actual status
    status: (item.statuses && item.statuses[0]) || "Live", // Use first status or default
    daysOnMarket: Math.floor(Math.random() * 30) + 1, // Mock data
    importedAt: new Date(),
    apiSource: 'manheim_live_api'
  };
}

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    console.log('✅ Connected to MongoDB successfully');
    return client;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

// Main function to fetch and save Manheim data
async function fetchManheimDataFiltered(sellerTypes = DEFAULT_SELLER_TYPES) {
  let client;
  let totalSaved = 0;
  
  try {
    console.log('🚀 Starting Manheim data fetch...');
    console.log(`📊 Fetching data for seller types: ${sellerTypes.join(', ')}`);
    
    // Get access token
    const accessToken = await generateManheimAccessToken();
    
    // Get color mapping
    const colorMap = await fetchExteriorColors(accessToken);
    
    // Connect to MongoDB
    client = await connectToMongoDB();
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Clear existing data (overwrite)
    console.log('🗑️ Clearing existing data...');
    await collection.deleteMany({});
    console.log('✅ Existing data cleared');
    
    // Create index on VIN for duplicate detection
    await collection.createIndex({ "vin": 1 }, { unique: true, sparse: true });
    await collection.createIndex({ "id": 1 }, { unique: true, sparse: true });
    console.log('✅ Database indexes created');
    
    let allVehicles = [];
    
    // Process state chunks
    for (const chunk of STATE_CHUNKS) {
      if (totalSaved >= MAX_RECORDS) {
        console.log(`🛑 Reached maximum limit of ${MAX_RECORDS} records`);
        break;
      }
      
      console.log(`🔍 Processing states: [${chunk.join(", ")}]`);
      
      let start = 0;
      let morePages = true;
      
      while (morePages && totalSaved < MAX_RECORDS) {
        const remainingSlots = MAX_RECORDS - totalSaved;
        const currentLimit = Math.min(BATCH_SIZE, remainingSlots);
        
        console.log(`   📡 API call: start=${start}, limit=${currentLimit}`);
        
        try {
          const response = await searchVehicles(accessToken, chunk, sellerTypes, start, currentLimit);
          const results = response.items || [];
          
          console.log(`   📋 Got ${results.length} vehicles from API`);
          
          if (results.length === 0) {
            morePages = false;
            break;
          }
          
          // Process vehicles with strict filtering
          const filteredResults = results.filter((item: any) => {
            // Apply strict quality filters
            const hasVin = !!item.vin
            const notSalvage = !item.salvageVehicle && !item.salvage
            const odometerOK = item.odometerCheckOK !== false
            const titleOK = item.titleAndProblemCheckOK !== false
            const notAsIs = !item.asIs
            const noFrameDamage = !item.hasFrameDamage
            const notCanadian = !item.previouslyCanadianListing
            
            const passes = hasVin && notSalvage && odometerOK && titleOK && notAsIs && noFrameDamage && notCanadian
            
            if (!passes) {
              console.log(`   🚫 Filtered out vehicle: VIN=${item.vin}, salvage=${item.salvageVehicle || item.salvage}, asIs=${item.asIs}, frameDamage=${item.hasFrameDamage}`)
            }
            
            return passes
          })
          
          const processedVehicles = filteredResults.map((item: any) => processVehicleData(item, colorMap))
          
          console.log(`   📋 Original: ${results.length}, Filtered: ${filteredResults.length}, Processed: ${processedVehicles.length}`);
          
          if (processedVehicles.length > 0) {
            try {
              const result = await collection.insertMany(processedVehicles, { ordered: false });
              const insertedCount = result.insertedCount;
              totalSaved += insertedCount;
              
              console.log(`   ✅ Saved ${insertedCount} vehicles (Total: ${totalSaved})`);
              
              if (insertedCount < processedVehicles.length) {
                console.log(`   ⚠️  ${processedVehicles.length - insertedCount} duplicates skipped`);
              }
            } catch (error) {
              if ((error as any).code === 11000) {
                // Handle duplicate key errors
                const insertedCount = (error as any).result?.insertedCount || 0;
                totalSaved += insertedCount;
                console.log(`   ⚠️  ${insertedCount} vehicles saved, rest were duplicates`);
              } else {
                console.error(`   ❌ Error saving batch:`, (error as Error).message);
              }
            }
          }
          
          start += currentLimit;
          morePages = results.length === currentLimit && totalSaved < MAX_RECORDS;
          
          // Add small delay to avoid rate limiting
          if (morePages) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
        } catch (error) {
          console.error(`   ❌ API call failed:`, (error as Error).message);
          break;
        }
      }
    }
    
    console.log(`🎉 Fetch complete! Total vehicles saved: ${totalSaved}`);
    
    // Show summary
    const totalCount = await collection.countDocuments();
    console.log(`📊 Total vehicles in collection: ${totalCount}`);
    
    return { totalSaved, totalCount };
    
  } catch (error) {
    console.error('❌ Error in fetchManheimDataFiltered:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('📤 MongoDB connection closed');
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sellerTypes = DEFAULT_SELLER_TYPES } = body;
    
    console.log('🔄 Data refresh requested');
    console.log('📊 Seller types:', sellerTypes);
    
    const result = await fetchManheimDataFiltered(sellerTypes);
    
    return NextResponse.json({
      success: true,
      message: `Successfully refreshed ${result.totalSaved} vehicles`,
      data: {
        totalSaved: result.totalSaved,
        totalCount: result.totalCount,
        sellerTypes: sellerTypes
      }
    });
    
  } catch (error) {
    console.error('❌ Refresh failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to refresh data', 
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to return available seller types
export async function GET() {
  const availableSellerTypes = [
    "Auction", "Bank", "Captive Finance", "Car Rental",
    "Credit Union", "Independent", "Franchise", "Fleet/Lease", 
    "Finance", "Lease", "Government", "Insurance", "Manufacturer",
    "Nonprofit", "Other", "Personal", "Repossession", "Trade"
  ];
  
  return NextResponse.json({
    success: true,
    data: {
      availableSellerTypes,
      defaultSellerTypes: DEFAULT_SELLER_TYPES
    }
  });
} 