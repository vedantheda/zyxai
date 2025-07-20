'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  PageSkeleton, 
  InlineSkeleton, 
  LayoutPreservingSkeleton 
} from '@/components/ui/page-skeleton'
import { 
  Skeleton,
  SkeletonCard, 
  SkeletonTable, 
  SkeletonList, 
  SkeletonStats,
  SkeletonDashboard,
  SkeletonAgents,
  SkeletonContacts,
  SkeletonCampaigns
} from '@/components/ui/skeleton'
import { 
  SmartSkeleton, 
  SkeletonWrapper, 
  ConditionalSkeleton,
  withSkeleton 
} from '@/components/ui/with-skeleton'
import { useSkeletonLoading, useSkeletonData } from '@/hooks/useSkeletonLoading'

// Demo component with skeleton
const DemoCard = withSkeleton(
  ({ title, content }: { title: string; content: string }) => (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{content}</p>
    </Card>
  ),
  { skeletonType: 'card', minLoadingTime: 500 }
)

export default function SkeletonDemoPage() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null)
  const [smartLoading, setSmartLoading] = useState(false)
  const [mockData, setMockData] = useState<any>(null)

  // Demo skeleton hook
  const skeleton = useSkeletonLoading({
    minLoadingTime: 1000,
    maxLoadingTime: 5000,
    debugName: 'SkeletonDemo'
  })

  // Demo data fetching with skeleton
  const { data, showSkeleton, refetch } = useSkeletonData(
    async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      return {
        users: [
          { id: 1, name: 'John Doe', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
        ]
      }
    },
    [],
    { minLoadingTime: 800 }
  )

  const startDemo = (type: string) => {
    setActiveDemo(type)
    setTimeout(() => setActiveDemo(null), 3000)
  }

  const startSmartDemo = () => {
    setSmartLoading(true)
    setMockData(null)
    setTimeout(() => {
      setMockData({ message: 'Data loaded successfully!' })
      setSmartLoading(false)
    }, 2500)
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Skeleton Loading Demo</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Interactive demonstration of the skeleton loading system
        </p>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Skeletons</TabsTrigger>
          <TabsTrigger value="page">Page Skeletons</TabsTrigger>
          <TabsTrigger value="smart">Smart Skeletons</TabsTrigger>
          <TabsTrigger value="hooks">Hooks Demo</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Skeleton Components</CardTitle>
              <CardDescription>
                Individual skeleton components for different content types
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Skeleton Card</h3>
                  <SkeletonCard />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Skeleton Stats</h3>
                  <SkeletonStats />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Skeleton Table</h3>
                <SkeletonTable rows={5} />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Skeleton List</h3>
                <SkeletonList items={4} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="page" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Page Skeleton Demos</CardTitle>
              <CardDescription>
                Full page skeletons for different application sections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Button 
                  onClick={() => startDemo('dashboard')}
                  variant={activeDemo === 'dashboard' ? 'default' : 'outline'}
                >
                  Dashboard
                </Button>
                <Button 
                  onClick={() => startDemo('agents')}
                  variant={activeDemo === 'agents' ? 'default' : 'outline'}
                >
                  Agents
                </Button>
                <Button 
                  onClick={() => startDemo('contacts')}
                  variant={activeDemo === 'contacts' ? 'default' : 'outline'}
                >
                  Contacts
                </Button>
                <Button 
                  onClick={() => startDemo('campaigns')}
                  variant={activeDemo === 'campaigns' ? 'default' : 'outline'}
                >
                  Campaigns
                </Button>
              </div>
              
              <div className="border rounded-lg min-h-[400px] bg-muted/20">
                {activeDemo === 'dashboard' && <SkeletonDashboard />}
                {activeDemo === 'agents' && <SkeletonAgents />}
                {activeDemo === 'contacts' && <SkeletonContacts />}
                {activeDemo === 'campaigns' && <SkeletonCampaigns />}
                {!activeDemo && (
                  <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                    Click a button above to see the page skeleton
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="smart" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Smart Skeleton Components</CardTitle>
              <CardDescription>
                Intelligent skeletons that handle loading, data, and error states
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Button onClick={startSmartDemo} className="mb-4">
                  Start Smart Loading Demo
                </Button>
                
                <SmartSkeleton 
                  loading={smartLoading} 
                  data={mockData} 
                  skeletonType="card"
                  errorFallback={<div className="text-red-600">Error occurred!</div>}
                >
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-2">Smart Content</h3>
                    <p className="text-muted-foreground">
                      {mockData?.message || 'No data available'}
                    </p>
                  </Card>
                </SmartSkeleton>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Skeleton Wrapper Demo</h3>
                <SkeletonWrapper loading={smartLoading} skeletonType="list" count={3}>
                  <div className="space-y-2">
                    <div className="p-3 border rounded">Item 1</div>
                    <div className="p-3 border rounded">Item 2</div>
                    <div className="p-3 border rounded">Item 3</div>
                  </div>
                </SkeletonWrapper>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Skeleton Hooks Demo</CardTitle>
              <CardDescription>
                Hooks for managing skeleton loading states
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">useSkeletonLoading Hook</h3>
                <div className="flex gap-4 mb-4">
                  <Button onClick={skeleton.startLoading}>Start Loading</Button>
                  <Button onClick={skeleton.stopLoading} variant="outline">Stop Loading</Button>
                  <Button onClick={skeleton.forceStop} variant="destructive">Force Stop</Button>
                </div>
                
                <ConditionalSkeleton show={skeleton.showSkeleton} type="card">
                  <Card className="p-6">
                    <h4 className="text-lg font-semibold mb-2">Manual Control</h4>
                    <p className="text-muted-foreground">
                      This content is controlled by the useSkeletonLoading hook
                    </p>
                  </Card>
                </ConditionalSkeleton>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">useSkeletonData Hook</h3>
                <Button onClick={refetch} className="mb-4">Refetch Data</Button>
                
                <ConditionalSkeleton show={showSkeleton} type="table">
                  <div className="border rounded-lg">
                    <div className="p-4 border-b bg-muted/50">
                      <h4 className="font-semibold">User Data</h4>
                    </div>
                    <div className="p-4">
                      {data?.users?.map((user: any) => (
                        <div key={user.id} className="flex justify-between py-2 border-b last:border-b-0">
                          <span>{user.name}</span>
                          <span className="text-muted-foreground">{user.email}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </ConditionalSkeleton>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">withSkeleton HOC</h3>
                <DemoCard 
                  title="HOC Demo" 
                  content="This component is wrapped with the withSkeleton HOC"
                  loading={skeleton.showSkeleton}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
