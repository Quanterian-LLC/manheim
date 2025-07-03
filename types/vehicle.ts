// Vehicle interface based on your MongoDB schema structure
export interface Vehicle {
  _id?: string
  source?: string
  id: string
  additionalAnnouncements?: string | null
  announcements?: string | null
  asIs?: boolean
  atAuction: boolean
  auctionEndTime: string
  auctionId?: string
  auctionStartTime?: string
  bidPrice: number
  bodyStyle: string
  bodyType?: string
  buyNowPrice?: number
  buyable: boolean
  buyerGroupId?: string
  canTakeOffers?: boolean
  closedSale?: boolean
  comments?: string
  conditionGradeNumeric?: number
  conditionReportUrl?: string
  conditionType?: string
  conditionTypeIds?: string[]
  detailPageUrl?: string | null
  doorCount?: number
  driveTrain?: string
  driveTrainIds?: string[]
  engineFuelType?: string
  engineFuelTypeIds?: string[]
  engineType?: string
  engineTypeIds?: string[]
  equipment?: string[] | null
  eventSaleId?: string | null
  eventSaleName?: string | null
  exteriorColor: string
  exteriorColorCode?: string
  exteriorColorIds?: string[]
  facilitatingAuction?: string
  facilitationLocation?: string
  facilitationServiceProviderCode?: string
  fordCategoryCode?: string | null
  frameDamage?: boolean
  hasAirConditioning?: boolean
  hasConditionReport?: boolean
  hasFrameDamage?: boolean
  hasPriorPaint?: boolean
  odometerCheckOK?: boolean
  titleAndProblemCheckOK?: boolean
  previouslyCanadianListing?: boolean
  startBuyNowPrice?: number
  images?: Array<{
    largeUrl: string
    smallUrl: string
    description?: string
    angle?: string
    dziUrl?: string
    sequence?: number
    category?: string
  }> | null
  interiorColor?: string
  interiorColorCode?: string
  interiorColorIds?: string[]
  interiorType?: string
  inventorySource?: string
  inventorySourceIds?: string[]
  isAutoGradeOrManheimGrade?: boolean
  isCertified?: boolean
  isManheimFacilitated?: boolean
  isTra?: boolean
  laneNumber?: string | null
  listedAt?: string
  locationCity: string
  locationFullZipcode?: string
  locationZipcode: string
  mComVdpUrl?: string
  make: string
  makeId?: string
  mmrPrice?: number
  modelIds?: string[]
  models: string[]
  odometer: number
  odometerUnits?: string
  offsite?: string | null
  options?: string[] | null
  orgGroupCodes?: string[] | null
  pickupLocation?: string
  pickupLocationCity?: string
  pickupLocationState?: string
  pickupLocationZipcode?: string
  pickupRegion?: string
  pickupRegionIds?: string[]
  remarks?: string | null
  runNumber?: string | null
  saleDate?: string
  saleDateList?: string[] | null
  saleNumber?: string | null
  saleYear?: string | null
  salvageVehicle: boolean
  salvageVehicleOrTitleStatus?: boolean
  sellerDisclosureUrl?: string
  sellerName?: string
  sellerTypes?: string[]
  simulcastSaleUrl?: string | null
  statusIds?: string[]
  statuses: string[]
  titleBrandings?: string[]
  titleState?: string | null
  titleStatus?: string
  titleStatusIds?: string[]
  topType?: string
  topTypeIds?: string[]
  transmission?: string
  transmissionIds?: string[]
  trimIds?: string[]
  trims?: string[]
  updatedAt?: string
  vehicleSubTypeIds?: string[]
  vehicleSubTypes?: string[]
  vehicleTypeIds?: string[]
  vehicleTypes?: string[]
  vin: string
  year: string
  yearId?: string
}

// API Response interfaces
export interface VehicleSearchResponse {
  vehicles: Vehicle[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: {
    makes: string[]
    bodyStyles: string[]
    years: string[]
    priceRange: {
      min: number
      max: number
    }
  }
}

export interface VehicleFilters {
  make?: string
  bodyStyle?: string
  minPrice?: number
  maxPrice?: number
  salvageVehicle?: boolean
  buyable?: boolean
  atAuction?: boolean
  pickupRegion?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
} 