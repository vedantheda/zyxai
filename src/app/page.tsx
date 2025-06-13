import { redirect } from 'next/navigation'
export default function Home() {
  // Redirect to pipeline for the SaaS app
  redirect('/pipeline')
}
