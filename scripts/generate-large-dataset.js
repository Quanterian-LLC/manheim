require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

// Vehicle data for generating realistic entries
const makes = ['Ford', 'Toyota', 'Honda', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Nissan', 'Hyundai', 'Kia', 'Mazda', 'Subaru', 'Lexus', 'Acura', 'Infiniti', 'Cadillac', 'Lincoln', 'Buick', 'GMC'];

const modelsByMake = {
  'Ford': ['F-150', 'Escape', 'Explorer', 'Fusion', 'Mustang', 'Edge', 'Transit Connect', 'Focus', 'Fiesta'],
  'Toyota': ['Camry', 'Corolla', 'Prius', 'RAV4', 'Highlander', 'Tacoma', 'Tundra', 'Sienna', 'Avalon'],
  'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey', 'Fit', 'HR-V', 'Passport', 'Ridgeline'],
  'Chevrolet': ['Silverado', 'Equinox', 'Malibu', 'Tahoe', 'Traverse', 'Cruze', 'Impala', 'Suburban'],
  'BMW': ['3 Series', '5 Series', 'X3', 'X5', '7 Series', 'i3', 'i8', 'Z4', 'X1'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'A-Class', 'CLA', 'GLS'],
  // Add more makes/models as needed
};

const bodyStyles = ['Sedan', 'SUV', 'Coupe', 'Hatchback', 'Convertible', 'Wagon', 'Pickup', 'Van', 'Crossover'];
const colors = ['White', 'Black', 'Silver', 'Gray', 'Blue', 'Red', 'Green', 'Brown', 'Gold', 'Orange'];
const cities = ['Atlanta', 'Dallas', 'Los Angeles', 'Chicago', 'New York', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Boston'];

function generateRandomVehicle(index) {
  const make = makes[Math.floor(Math.random() * makes.length)];
  const models = modelsByMake[make] || ['Unknown Model'];
  const model = models[Math.floor(Math.random() * models.length)];
  const year = 2015 + Math.floor(Math.random() * 9); // 2015-2023
  const bodyStyle = bodyStyles[Math.floor(Math.random() * bodyStyles.length)];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  
  // Generate realistic pricing
  const basePrice = 15000 + Math.floor(Math.random() * 50000); // $15k-$65k
  const mmrPrice = basePrice + (Math.random() - 0.5) * 8000; // MMR varies ±$4k
  const bidPrice = mmrPrice + (Math.random() - 0.6) * 5000; // Bid price usually below MMR
  
  // Generate realistic mileage based on age
  const age = 2024 - year;
  const avgMilesPerYear = 8000 + Math.random() * 7000; // 8k-15k miles/year
  const odometer = Math.floor(age * avgMilesPerYear + (Math.random() - 0.5) * 20000);
  
  return {
    make,
    models: [model],
    year,
    bodyStyle,
    odometer: Math.max(0, odometer),
    bidPrice: Math.floor(Math.max(5000, bidPrice)),
    buyNowPrice: Math.floor(bidPrice * (1.1 + Math.random() * 0.3)), // 10-40% above bid
    buyable: Math.random() > 0.3, // 70% are buyable
    atAuction: Math.random() > 0.4, // 60% at auction
    auctionEndTime: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    exteriorColor: color,
    locationCity: city,
    locationZipcode: (10000 + Math.floor(Math.random() * 89999)).toString(),
    titleBrandings: Math.random() > 0.15 ? ['Clean'] : ['Salvage'], // 15% salvage
    salvageVehicle: Math.random() < 0.15,
    salvage: Math.random() < 0.15,
    statuses: ['Live'],
    vin: generateVIN(make),
    mmrPrice: Math.floor(Math.max(5000, mmrPrice)),
    mmr: Math.floor(Math.max(5000, mmrPrice)),
    conditionGradeNumeric: Math.round((1 + Math.random() * 4) * 10) / 10, // 1.0-5.0
    daysOnMarket: Math.floor(Math.random() * 45) + 1, // 1-45 days
    viewCount: Math.floor(Math.random() * 200),
    bidCount: Math.floor(Math.random() * 15),
    listingStatus: ['active', 'hot', 'new_listing', 'needs_relisting'][Math.floor(Math.random() * 4)],
    carfaxStatus: Math.random() > 0.2 ? 'clean' : 'issues', // 80% clean
    autoCheckStatus: Math.random() > 0.25 ? 'clean' : 'issues' // 75% clean
  };
}

function generateVIN(make) {
  const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  const numbers = '0123456789';
  let vin = '';
  
  // Simple VIN generation (not real VIN algorithm)
  for (let i = 0; i < 17; i++) {
    if (i < 3) {
      vin += letters[Math.floor(Math.random() * letters.length)];
    } else if (i < 8) {
      vin += Math.random() > 0.5 ? letters[Math.floor(Math.random() * letters.length)] : numbers[Math.floor(Math.random() * numbers.length)];
    } else {
      vin += numbers[Math.floor(Math.random() * numbers.length)];
    }
  }
  return vin;
}

async function generateLargeDataset(count = 1000) {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    return;
  }

  console.log(`🔗 Connecting to MongoDB Atlas to generate ${count} vehicles...`);
  
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas!');

    const db = client.db('manheim');
    const collection = db.collection('manheim_car_data');

    // Check existing count
    const existingCount = await collection.countDocuments();
    console.log(`📊 Existing vehicles in database: ${existingCount}`);

    if (existingCount > 0 && !process.argv.includes('--replace')) {
      console.log('⚠️  Database contains existing vehicles');
      console.log('   Use --replace flag to replace all existing data');
      console.log('   Use --add flag to add to existing data');
      
      if (!process.argv.includes('--add')) {
        console.log('❌ Operation cancelled');
        return;
      }
    }

    // Clear existing data if replacing
    if (process.argv.includes('--replace')) {
      await collection.deleteMany({});
      console.log('🧹 Cleared existing data');
    }

    // Generate vehicles in batches for better performance
    const batchSize = 100;
    const batches = Math.ceil(count / batchSize);
    let totalInserted = 0;

    console.log(`🚗 Generating ${count} vehicles in ${batches} batches...`);

    for (let batch = 0; batch < batches; batch++) {
      const vehiclesInThisBatch = Math.min(batchSize, count - (batch * batchSize));
      const vehicles = [];
      
      for (let i = 0; i < vehiclesInThisBatch; i++) {
        vehicles.push(generateRandomVehicle(totalInserted + i));
      }

      const result = await collection.insertMany(vehicles);
      totalInserted += result.insertedCount;
      
      console.log(`✅ Batch ${batch + 1}/${batches} completed (${totalInserted}/${count} vehicles)`);
    }

    // Verify final count
    const finalCount = await collection.countDocuments();
    console.log(`📊 Total vehicles in database: ${finalCount}`);
    console.log('🎉 Large dataset generated successfully!');
    
  } catch (error) {
    console.error('❌ Error generating dataset:', error.message);
  } finally {
    await client.close();
    console.log('🔚 Connection closed');
  }
}

// Parse command line arguments
const count = parseInt(process.argv.find(arg => arg.startsWith('--count='))?.split('=')[1]) || 1000;

if (require.main === module) {
  console.log('🏗️  Large Dataset Generator');
  console.log('Usage: node generate-large-dataset.js [--count=1000] [--replace] [--add]');
  console.log('');
  generateLargeDataset(count);
}

module.exports = { generateLargeDataset, generateRandomVehicle }; 