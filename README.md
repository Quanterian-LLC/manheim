# 🏁 Vehicle Auction Hub

A modern, user-friendly Next.js web application for browsing and bidding on vehicle auctions. Built with a clean interface and powerful filtering capabilities.

## ✨ Features

### 🔍 **Smart Search & Filtering**
- **Quick Filters**: Live Auctions, Ending Soon, Buy Now, Good Deals, Local Pickup, No Reserve
- **Advanced Filters**: Make, Model, Year, Body Style, Price Range, Condition, Location
- **Search**: By make, model, VIN, or keywords
- **Sorting**: Price, mileage, auction end time, recently listed

### 🚗 **Vehicle Information**
- Detailed vehicle cards with key information
- Condition grades and MMR pricing
- Auction status and timing
- Title branding (Clean, Salvage, etc.)
- Location and pickup information
- Deal scoring (% below/above MMR value)

### 🏆 **Auction Features**
- Live auction browsing
- Bid placement and Buy Now options
- Auction end time countdown
- Bid history tracking
- Real-time status updates

### 📊 **Market Analytics**
- Price trend analysis
- Regional pricing comparison
- Condition impact on pricing
- Historical price data
- Competitor analysis
- Market recommendations

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd manheim-auction-app
   ```

2. **Install dependencies** (already done)
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠 **API Endpoints**

### Vehicle Search
```
GET /api/vehicles
```
**Query Parameters:**
- `make` - Filter by manufacturer
- `bodyStyle` - Filter by body style
- `minPrice` / `maxPrice` - Price range
- `salvageVehicle` - Include/exclude salvage vehicles
- `buyable` - Show only Buy Now available
- `atAuction` - Show only live auctions
- `search` - Search term
- `sortBy` - Sort field (bidPrice, year, odometer)
- `page` / `limit` - Pagination

**Example:**
```
GET /api/vehicles?make=Ford&bodyStyle=Cargo%20Van&maxPrice=10000&buyable=true
```

### Vehicle Details
```
GET /api/vehicles/[id]
```
Get detailed information for a specific vehicle including bid history, equipment, and images.

### Place Bid / Buy Now
```
POST /api/vehicles/[id]
```
**Body:**
```json
{
  "action": "bid" | "buyNow",
  "amount": 5000
}
```

### Auctions
```
GET /api/auctions
```
**Query Parameters:**
- `status` - live, upcoming, ended
- `type` - online, physical, hybrid
- `location` - Filter by location

### Market Analysis
```
GET /api/market-analysis?make=Ford&model=Transit%20Connect&year=2013
```

## 🎨 **UI Components**

### **Header**
- Logo and navigation
- Global search bar
- Quick access to Live Auctions, Ending Soon
- User account and favorites

### **Quick Filters**
- Preset filter buttons with vehicle counts
- Live Auctions, Ending Soon, Buy Now, Good Deals, Local Pickup, No Reserve

### **Filter Sidebar**
- Price range slider
- Make and body style checkboxes
- Year range selectors
- Special conditions (Buy Now, Live Auction, Exclude Salvage)

### **Vehicle Cards**
- Vehicle image placeholder
- Status badges (Live, Ending Soon, Sold)
- Good deal indicators (% below MMR)
- Key specs (year, make, model, mileage)
- Title branding warnings
- Pricing information (Current Bid, Buy Now, MMR Value)
- Location and timing
- Action buttons (Bid, Buy Now, View Details)

## 🏗 **Project Structure**

```
manheim-auction-app/
├── app/
│   ├── components/
│   │   ├── Header.tsx           # Navigation header
│   │   ├── QuickFilters.tsx     # Preset filter buttons
│   │   ├── FilterSidebar.tsx    # Advanced filtering
│   │   ├── VehicleGrid.tsx      # Vehicle listing grid
│   │   └── VehicleCard.tsx      # Individual vehicle cards
│   ├── api/
│   │   ├── vehicles/
│   │   │   ├── route.ts         # Vehicle search & listing
│   │   │   └── [id]/route.ts    # Vehicle details & bidding
│   │   ├── auctions/route.ts    # Auction information
│   │   └── market-analysis/route.ts # Pricing analytics
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 🎯 **Key Features Explained**

### **Smart Deal Detection**
The app calculates deal scores by comparing current bid prices to MMR (Market Value Report) values:
- **Green badge**: 10%+ below MMR (Good Deal)
- **Price comparison**: Shows current bid vs MMR value
- **Market analysis**: Regional and historical pricing data

### **Intuitive Filtering**
- **Quick Filters**: One-click access to popular searches
- **Visual Feedback**: Filter counts show available vehicles
- **Persistent State**: Filters maintain state across page navigation
- **Smart Defaults**: Reasonable default values for better UX

### **Real-time Auction Status**
- **Live indicators**: Shows active auction status
- **Time remaining**: Countdown to auction end
- **Status badges**: Clear visual indicators (Live, Ending, Sold)
- **Bid history**: Track bidding activity

### **Mobile-First Design**
- **Responsive grid**: Adapts to screen size (1-3 columns)
- **Touch-friendly**: Large buttons and easy navigation
- **Fast loading**: Optimized images and efficient API calls

## 🔧 **Customization**

### **Adding New Filters**
1. Update the API route in `app/api/vehicles/route.ts`
2. Add filter controls in `FilterSidebar.tsx`
3. Update the TypeScript interfaces

### **Styling**
- Uses Tailwind CSS for styling
- Custom color scheme defined in `tailwind.config.js`
- Component-specific styles in `globals.css`

### **Data Integration**
Replace mock data in API routes with your actual data source:
- MongoDB integration already included
- Update API routes to connect to your database
- Modify data structures as needed

## 🚦 **Development Tips**

1. **Hot Reload**: Changes automatically refresh in development
2. **TypeScript**: Full type safety for better development experience
3. **API Testing**: Use tools like Postman to test API endpoints
4. **Responsive Design**: Test on different screen sizes
5. **Performance**: Use React DevTools for optimization

## 🎉 **Ready to Use**

The app is now ready to run! It includes:
- ✅ Modern, clean UI design
- ✅ Comprehensive filtering system
- ✅ Responsive layout
- ✅ API endpoints with mock data
- ✅ TypeScript support
- ✅ Tailwind CSS styling

Start the development server and begin customizing for your specific needs! 