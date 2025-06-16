# Quick Setup Guide

## 🚀 **Running the App**

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   - Visit `http://localhost:3000` (or the port shown in terminal)

## 📊 **MongoDB Setup (Optional)**

The app works with **mock data** by default. To connect to your MongoDB:

1. **Create `.env.local` file:**
   ```
   MONGODB_URI=mongodb://localhost:27017/Manheim
   ```

2. **For MongoDB Atlas:**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/Manheim
   ```

3. **Database Structure:**
   - Database: `Manheim`
   - Collection: `manheim_car_data`

## 🎯 **Features Working:**

✅ **Mock Data Mode** - App works without MongoDB  
✅ **Vehicle Cards** - Ford Transit Connect, Toyota Camry, BMW 3 Series  
✅ **Filtering** - Make, body style, price range  
✅ **Search** - By make, model, VIN  
✅ **Responsive Design** - Mobile & desktop  
✅ **Modern UI** - Tailwind CSS styling  

## 🔧 **Troubleshooting:**

- **CSS not loading?** Clear cache: `rm -rf .next && npm run dev`
- **MongoDB errors?** App falls back to mock data automatically
- **Port issues?** Next.js will try different ports (3001, 3002, etc.)

Your app should be running at **http://localhost:3000** (or the port shown)! 