# MongoDB Atlas Setup Guide

## ✅ **Completed Setup**

Your application is now configured to use **MongoDB Atlas** cloud database instead of local MongoDB.

### **Connection Details**
- **Database**: `manheim` (lowercase)
- **Collection**: `manheim_car_data`
- **Connection String**: MongoDB Atlas (configured in `.env.local`)
- **Current Data**: 1000 realistic vehicle records

---

## 🔧 **Configuration Files**

### 1. **Environment Variables** (`.env.local`)
```env
MONGODB_URI=mongodb+srv://quanterian:trvPE8ATKOkhljg1@cluster0.wfoalju.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
NODE_ENV=development
```

### 2. **Connection Library** (`lib/mongodb.ts`)
- Optimized for MongoDB Atlas
- Automatic database name detection
- Connection pooling configured
- Error handling and retry logic

---

## 🚀 **Current Status**

✅ **MongoDB Atlas Connection**: Working  
✅ **Database**: `manheim` (1000 vehicles)  
✅ **Collection**: `manheim_car_data`  
✅ **Large Dataset**: Generated with realistic data  
✅ **Application**: Fully functional with pagination and search  

---

## 📊 **Current Dataset**

The database now contains **1000 realistic vehicles**:
- **Makes**: Ford, Toyota, Honda, Chevrolet, BMW, Mercedes-Benz, Audi, and more
- **Years**: 2015-2023  
- **Price Range**: $5,000 - $65,000
- **Features**: Realistic MMR analysis, condition grades, location data
- **Pagination**: 20 vehicles per page (50 total pages)

---

## 🛠 **Available Scripts**

### **Generate Large Dataset**
```bash
# Generate 1000 new vehicles (replace existing)
node scripts/generate-large-dataset.js --replace --count=1000

# Add more vehicles to existing data
node scripts/generate-large-dataset.js --add --count=500

# Generate specific count
node scripts/generate-large-dataset.js --replace --count=2000
```

### **Populate Sample Data** (Small dataset)
```bash
# Add 5 sample vehicles (safe mode)
node scripts/populate-sample-data.js

# Force add sample data
node scripts/populate-sample-data.js --force

# Clear and add sample data (only if < 100 vehicles)
node scripts/populate-sample-data.js --clear
```

### **Test Connection**
```bash
node -e "
require('dotenv').config({path:'.env.local'});
const {MongoClient} = require('mongodb');
new MongoClient(process.env.MONGODB_URI).connect()
  .then(() => console.log('✅ MongoDB Atlas connected!'))
  .catch(err => console.log('❌ Connection failed:', err.message))
  .finally(() => process.exit());
"
```

---

## 🔄 **How It Works**

1. **Application Startup**: Connects to MongoDB Atlas using `.env.local`
2. **Data Fetching**: Uses real data from `manheim_car_data` collection
3. **Fallback**: If connection fails, uses mock data automatically
4. **Real-time**: All CRUD operations work with your cloud database

---

## 📝 **Data Structure**

Each vehicle document contains:
```json
{
  "_id": "ObjectId",
  "make": "Toyota",
  "models": ["Camry"],
  "year": 2020,
  "bodyStyle": "Sedan",
  "odometer": 45000,
  "bidPrice": 18500,
  "buyNowPrice": 22000,
  "mmr": 19500,
  "locationCity": "Los Angeles",
  "vin": "4T1G11AK1LU123456",
  "salvage": false,
  "atAuction": true,
  "daysOnMarket": 5,
  "carfaxStatus": "clean",
  // ... more fields
}
```

---

## 🚨 **Important Notes**

1. **Environment File**: `.env.local` is in `.gitignore` (secure)
2. **Database Name**: Uses `manheim` (lowercase) 
3. **Collection**: All vehicle data in `manheim_car_data`
4. **Credentials**: Stored securely in environment variables
5. **Auto-Fallback**: Mock data if Atlas is unavailable

---

## 🎯 **Next Steps**

1. **Your app is ready** - Real data is being used from MongoDB Atlas
2. **Add more data** - Use the populate script or add via MongoDB Compass
3. **Monitor usage** - Check MongoDB Atlas dashboard for metrics
4. **Scale up** - Upgrade Atlas cluster as needed

---

**✨ Your Manheim Vehicle Auction App is now powered by MongoDB Atlas!** 