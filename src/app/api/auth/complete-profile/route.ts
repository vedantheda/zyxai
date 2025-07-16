import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { OrganizationService } from '@/lib/services/OrganizationService'
import { validateEmail, sanitizeString } from '@/lib/apiSecurity'

interface CompleteProfileRequest {
  userId: string
  firstName: string
  lastName: string
  organizationName: string
  organizationSlug?: string
  organizationDescription?: string
  organizationIndustry?: string
  organizationWebsite?: string
  organizationPhone?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CompleteProfileRequest = await request.json()
    const {
      userId,
      firstName,
      lastName,
      organizationName,
      organizationSlug,
      organizationDescription,
      organizationIndustry,
      organizationWebsite,
      organizationPhone
    } = body

    // Validate required fields
    if (!userId || !firstName || !lastName || !organizationName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Verify the user is authenticated and matches the userId
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser || authUser.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user already has a profile
    const { user: existingUser } = await OrganizationService.getUserOrganization(userId)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User profile already exists' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedData = {
      firstName: sanitizeString(firstName),
      lastName: sanitizeString(lastName),
      organizationName: sanitizeString(organizationName),
      organizationSlug: organizationSlug ? sanitizeString(organizationSlug) : OrganizationService.generateSlug(organizationName),
      organizationDescription: organizationDescription ? sanitizeString(organizationDescription) : undefined,
      organizationIndustry: organizationIndustry ? sanitizeString(organizationIndustry) : undefined,
      organizationWebsite: organizationWebsite ? sanitizeString(organizationWebsite) : undefined,
      organizationPhone: organizationPhone ? sanitizeString(organizationPhone) : undefined
    }

    // Validate organization slug
    const slugValidation = OrganizationService.validateSlug(sanitizedData.organizationSlug)
    if (!slugValidation.valid) {
      return NextResponse.json(
        { error: slugValidation.error || 'Invalid organization slug' },
        { status: 400 }
      )
    }

    // Step 1: Create organization
    const { organization, error: orgError } = await OrganizationService.createOrganization({
      name: sanitizedData.organizationName,
      slug: sanitizedData.organizationSlug,
      description: sanitizedData.organizationDescription,
      industry: sanitizedData.organizationIndustry,
      website: sanitizedData.organizationWebsite,
      phone: sanitizedData.organizationPhone
    })

    if (orgError || !organization) {
      console.error('Organization creation error:', orgError)
      return NextResponse.json(
        { error: orgError || 'Failed to create organization' },
        { status: 500 }
      )
    }

    // Step 2: Create user record in database
    const { user: dbUser, error: userError } = await OrganizationService.addUserToOrganization(
      userId,
      organization.id,
      'owner', // User completing profile becomes the owner
      {
        email: authUser.email!,
        first_name: sanitizedData.firstName,
        last_name: sanitizedData.lastName
      }
    )

    if (userError || !dbUser) {
      console.error('User creation error:', userError)
      return NextResponse.json(
        { error: userError || 'Failed to create user profile' },
        { status: 500 }
      )
    }

    console.log('✅ Profile completion successful:', {
      userId,
      email: authUser.email,
      organizationId: organization.id,
      organizationSlug: organization.slug
    })

    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        first_name: dbUser.first_name,
        last_name: dbUser.last_name,
        role: dbUser.role
      },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug
      },
      message: 'Profile completed successfully!'
    })

  } catch (error: any) {
    console.error('Complete profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error during profile completion' },
      { status: 500 }
    )
  }
}
