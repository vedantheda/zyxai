import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { OrganizationService } from '@/lib/services/OrganizationService'
import { validateEmail, sanitizeString } from '@/lib/apiSecurity'

interface SignupRequest {
  email: string
  password: string
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
    const body: SignupRequest = await request.json()
    const {
      email,
      password,
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
    if (!email || !password || !firstName || !lastName || !organizationName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedData = {
      email: sanitizeString(email.toLowerCase()),
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

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: sanitizedData.email,
      password,
      options: {
        data: {
          first_name: sanitizedData.firstName,
          last_name: sanitizedData.lastName,
          full_name: `${sanitizedData.firstName} ${sanitizedData.lastName}`
        }
      }
    })

    if (authError) {
      console.error('Auth signup error:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Step 2: Create organization
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
      
      // Clean up auth user if organization creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      
      return NextResponse.json(
        { error: orgError || 'Failed to create organization' },
        { status: 500 }
      )
    }

    // Step 3: Create user record in database
    const { user: dbUser, error: userError } = await OrganizationService.addUserToOrganization(
      authData.user.id,
      organization.id,
      'owner', // First user is always the owner
      {
        email: sanitizedData.email,
        first_name: sanitizedData.firstName,
        last_name: sanitizedData.lastName
      }
    )

    if (userError || !dbUser) {
      console.error('User creation error:', userError)
      
      // Clean up auth user and organization if user creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      // Note: Organization cleanup would need to be handled by admin
      
      return NextResponse.json(
        { error: userError || 'Failed to create user profile' },
        { status: 500 }
      )
    }

    console.log('✅ Complete signup successful:', {
      userId: authData.user.id,
      email: sanitizedData.email,
      organizationId: organization.id,
      organizationSlug: organization.slug
    })

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        emailConfirmed: !!authData.user.email_confirmed_at
      },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug
      },
      message: authData.user.email_confirmed_at 
        ? 'Account created successfully! You can now sign in.'
        : 'Account created! Please check your email to verify your account before signing in.'
    })

  } catch (error: any) {
    console.error('Signup API error:', error)
    return NextResponse.json(
      { error: 'Internal server error during signup' },
      { status: 500 }
    )
  }
}
