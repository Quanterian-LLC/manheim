require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    return;
  }

  console.log('🔗 Testing MongoDB Atlas connection...');
  console.log(`📍 URI: ${uri.substring(0, 20)}...`);

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  try {
    // Connect to MongoDB Atlas
    await client.connect();
    console.log('✅ Successfully connected to MongoDB Atlas!');

    // Test database connection
    const db = client.db('Manheim');
    console.log(`📊 Connected to database: ${db.databaseName}`);

    // List collections
    const collections = await db.listCollections().toArray();
    console.log('📁 Available collections:');
    collections.forEach((collection, index) => {
      console.log(`   ${index + 1}. ${collection.name}`);
    });

    // Test the specific collection
    const collection = db.collection('manheim_car_data');
    const count = await collection.countDocuments();
    console.log(`🚗 Total vehicles in manheim_car_data: ${count}`);

    // Get a sample document
    const sampleDoc = await collection.findOne({});
    if (sampleDoc) {
      console.log('📋 Sample document structure:');
      console.log('   Keys:', Object.keys(sampleDoc).slice(0, 10).join(', '));
    }

  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed:');
    console.error(error.message);
  } finally {
    await client.close();
    console.log('🔚 Connection closed');
  }
}

testConnection(); 