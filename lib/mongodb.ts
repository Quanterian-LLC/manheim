import { MongoClient, Db, Collection } from 'mongodb'

// Get MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DATABASE_NAME = 'manheim'
const COLLECTION_NAME = 'manheim_car_data'

// Optimized connection options for better performance
const options = {
  maxPoolSize: 50, // Increased pool size for better concurrent connections
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 3000, // Reduced timeout for faster failures
  socketTimeoutMS: 30000, // Reduced socket timeout
  connectTimeoutMS: 10000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true,
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

// Create MongoDB client instance with connection caching
if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the connection
  // across module reloads caused by HMR (Hot Module Replacement)
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable
  client = new MongoClient(MONGODB_URI, options)
  clientPromise = client.connect()
}

// Cached database connection
let cachedDb: Db | null = null

// Main function to connect to database and get collection (with caching)
export async function connectToDatabase(): Promise<{ db: Db; collection: Collection }> {
  try {
    if (cachedDb) {
      // Return cached connection
      return { 
        db: cachedDb, 
        collection: cachedDb.collection(COLLECTION_NAME) 
      }
    }

    const client = await clientPromise
    const db = client.db(DATABASE_NAME)
    const collection = db.collection(COLLECTION_NAME)
    
    // Cache the database connection
    cachedDb = db
    
    console.log(`✅ Connected to MongoDB: ${DATABASE_NAME}.${COLLECTION_NAME}`)
    
    return { db, collection }
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error)
    throw error
  }
}

export default clientPromise 