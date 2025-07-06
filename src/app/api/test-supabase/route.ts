import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .limit(1)

    if (error) {
      console.error('Supabase connection error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: 'Failed to connect to Supabase database'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      data: data || [],
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Test Supabase error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      details: 'Failed to test Supabase connection'
    }, { status: 500 })
  }
}
