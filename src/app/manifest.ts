import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Neuronize - AI-Powered Tax Practice Management',
    short_name: 'Neuronize',
    description: 'Enterprise-grade tax practice management platform with AI-powered document processing and automated workflows.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0A0F14',
    theme_color: '#FF8C00',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '32x32',
        type: 'image/x-icon',
      },
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
