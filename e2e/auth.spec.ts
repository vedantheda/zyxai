import { test, expect } from '@playwright/test'

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/')
  
  // Should redirect to pipeline for admin users
  await expect(page).toHaveURL(/\/pipeline/)
  
  // Check for main navigation
  await expect(page.locator('nav')).toBeVisible()
})

test('authentication flow', async ({ page }) => {
  await page.goto('/signin')
  
  // Fill in login form
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password123')
  
  // Submit form
  await page.click('button[type="submit"]')
  
  // Should redirect after login
  await expect(page).toHaveURL(/\/pipeline/)
})
