import { MongoClient, Db, Collection } from 'mongodb'

// Default to a local MongoDB if no URI is provided
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/Manheim'
const options = {}

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
    const db = client.db('Manheim') // Your database name
    const collection = db.collection('manheim_car_data') // Your collection name
    
    return { db, collection }
  } catch (error) {
    console.log('MongoDB connection failed:', error)
    throw error
  }
}

export default clientPromise 