import { redirect } from 'next/navigation'
export default function Home() {
  // Redirect to dashboard for the SaaS app
  redirect('/dashboard')
}
