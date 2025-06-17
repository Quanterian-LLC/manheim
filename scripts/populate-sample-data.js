require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const sampleVehicles = [
  {
    make: "Ford",
    models: ["Transit Connect"],
    year: 2013,
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
    salvage: true,
    statuses: ["Live"],
    vin: "NM0LS7CNXDT154708",
    mmrPrice: 4350,
    mmr: 4350,
    conditionGradeNumeric: 2.1,
    daysOnMarket: 15,
    viewCount: 23,
    bidCount: 2,
    listingStatus: "active",
    carfaxStatus: "issues",
    autoCheckStatus: "issues"
  },
  {
    make: "Toyota",
    models: ["Camry"],
    year: 2020,
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
    salvage: false,
    statuses: ["Live"],
    vin: "4T1G11AK1LU123456",
    mmrPrice: 19500,
    mmr: 19500,
    conditionGradeNumeric: 3.8,
    daysOnMarket: 5,
    viewCount: 67,
    bidCount: 8,
    listingStatus: "active",
    carfaxStatus: "clean",
    autoCheckStatus: "clean"
  },
  {
    make: "BMW",
    models: ["3 Series"],
    year: 2019,
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
    salvage: false,
    statuses: ["Live"],
    vin: "WBA5A7C50KD123456",
    mmrPrice: 26000,
    mmr: 26000,
    conditionGradeNumeric: 4.2,
    daysOnMarket: 8,
    viewCount: 89,
    bidCount: 12,
    listingStatus: "hot",
    carfaxStatus: "clean",
    autoCheckStatus: "clean"
  },
  {
    make: "Chevrolet",
    models: ["Malibu"],
    year: 2021,
    bodyStyle: "Sedan",
    odometer: 25000,
    bidPrice: 18500,
    buyNowPrice: 21000,
    buyable: true,
    atAuction: true,
    auctionEndTime: "2025-06-18T16:45:00Z",
    exteriorColor: "White",
    locationCity: "Miami",
    locationZipcode: "33101",
    titleBrandings: ["Clean"],
    salvageVehicle: false,
    salvage: false,
    statuses: ["Live"],
    vin: "1G1ZD5ST5MF123456",
    mmrPrice: 22000,
    mmr: 22000,
    conditionGradeNumeric: 4.3,
    daysOnMarket: 2,
    viewCount: 156,
    bidCount: 15,
    listingStatus: "new_listing",
    carfaxStatus: "clean",
    autoCheckStatus: "clean"
  },
  {
    make: "Honda",
    models: ["Civic"],
    year: 2019,
    bodyStyle: "Sedan",
    odometer: 32000,
    bidPrice: 19500,
    buyNowPrice: 22000,
    buyable: true,
    atAuction: false,
    auctionEndTime: "2025-06-20T14:30:00Z",
    exteriorColor: "Blue",
    locationCity: "Dallas",
    locationZipcode: "75201",
    titleBrandings: ["Clean"],
    salvageVehicle: false,
    salvage: false,
    statuses: ["Live"],
    vin: "2HGFC2F59JH542123",
    mmrPrice: 16800,
    mmr: 16800,
    conditionGradeNumeric: 4.1,
    daysOnMarket: 22,
    viewCount: 12,
    bidCount: 0,
    listingStatus: "needs_relisting",
    carfaxStatus: "clean",
    autoCheckStatus: "clean"
  }
];

async function populateData() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    return;
  }

  console.log('🔗 Connecting to MongoDB Atlas...');
  
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas!');

    const db = client.db('manheim');
    const collection = db.collection('manheim_car_data');

    // Check existing count before doing anything
    const existingCount = await collection.countDocuments();
    console.log(`📊 Existing vehicles in database: ${existingCount}`);

    // Only clear if specifically requested and existing count is small
    if (process.argv.includes('--clear') && existingCount < 100) {
      await collection.deleteMany({});
      console.log('🧹 Cleared existing data (as requested)');
    } else if (existingCount > 100) {
      console.log('⚠️  Large dataset detected - NOT clearing existing data');
      console.log('   Use --clear flag if you really want to clear all data');
    }

    // Insert sample data only if no data exists or if forced
    if (existingCount === 0 || process.argv.includes('--force')) {
      const result = await collection.insertMany(sampleVehicles);
      console.log(`✅ Inserted ${result.insertedCount} sample vehicles`);
    } else {
      console.log('ℹ️  Skipping insert - data already exists');
      console.log('   Use --force flag to add sample data anyway');
    }

    // Verify final count
    const finalCount = await collection.countDocuments();
    console.log(`📊 Total vehicles in database: ${finalCount}`);

    console.log('🎉 Operation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('🔚 Connection closed');
  }
}

if (require.main === module) {
  populateData();
}

module.exports = { populateData, sampleVehicles }; 