import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const make = searchParams.get('make')
    const model = searchParams.get('model')
    const year = searchParams.get('year')
    
    // Mock market analysis data
    const analysis = {
      vehicleInfo: {
        make: make || 'Ford',
        model: model || 'Transit Connect',
        year: year || '2013'
      },
      priceAnalysis: {
        averageAuctionPrice: 4750,
        mmrValue: 4350,
        marketTrend: 'stable', // up, down, stable
        priceChange: '+2.3%',
        sampleSize: 45
      },
      regionPricing: [
        { region: 'West', avgPrice: 4650, count: 12 },
        { region: 'East', avgPrice: 4850, count: 18 },
        { region: 'Central', avgPrice: 4700, count: 15 }
      ],
      conditionImpact: [
        { grade: '4.0-5.0', avgPrice: 5200, premium: '+19%' },
        { grade: '3.0-3.9', avgPrice: 4750, premium: '+9%' },
        { grade: '2.0-2.9', avgPrice: 4350, premium: '0%' },
        { grade: '1.0-1.9', avgPrice: 3800, premium: '-13%' }
      ],
      historicalTrends: [
        { month: 'Jan 2024', avgPrice: 4200 },
        { month: 'Feb 2024', avgPrice: 4150 },
        { month: 'Mar 2024', avgPrice: 4300 },
        { month: 'Apr 2024', avgPrice: 4450 },
        { month: 'May 2024', avgPrice: 4650 },
        { month: 'Jun 2024', avgPrice: 4750 }
      ],
      competitorAnalysis: [
        { make: 'Ford', model: 'Transit Connect', avgPrice: 4750, marketShare: '35%' },
        { make: 'Chevrolet', model: 'City Express', avgPrice: 4200, marketShare: '28%' },
        { make: 'Nissan', model: 'NV200', avgPrice: 4950, marketShare: '22%' },
        { make: 'Ram', model: 'ProMaster City', avgPrice: 5100, marketShare: '15%' }
      ],
      recommendations: [
        'Current pricing is 9% above MMR value',
        'West region shows lower average prices',
        'Consider condition grade impact on pricing',
        'Market trend is stable with slight upward movement'
      ]
    }
    
    return NextResponse.json(analysis)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market analysis' },
      { status: 500 }
    )
  }
} 