import { MongoClient, Db, Collection } from 'mongodb'

// Use MongoDB Atlas URI from environment variables
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const options = {
  // Add MongoDB Atlas optimizations
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  // Removed bufferMaxEntries as it's deprecated in newer MongoDB drivers
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export async function connectToDatabase(): Promise<{ db: Db; collection: Collection }> {
  try {
    const client = await clientPromise
    
    // For MongoDB Atlas, use lowercase database name to match existing
    let dbName = 'manheim' // Use lowercase to match existing database
    
    if (uri.includes('mongodb+srv://')) {
      // For Atlas connections, try to extract database name from URI
      const urlParts = uri.split('/')
      const afterHost = urlParts[3]
      if (afterHost && !afterHost.startsWith('?')) {
        dbName = afterHost.split('?')[0]
      } else {
        // Use existing lowercase database name
        dbName = 'manheim'
      }
    }
    
    const db = client.db(dbName)
    const collection = db.collection('manheim_car_data') // Your collection name
    
    // Test the connection
    await collection.findOne({})
    console.log(`Successfully connected to MongoDB Atlas database: ${dbName}`)
    
    return { db, collection }
  } catch (error) {
    console.log('MongoDB connection failed:', error)
    throw error
  }
}

export default clientPromise 