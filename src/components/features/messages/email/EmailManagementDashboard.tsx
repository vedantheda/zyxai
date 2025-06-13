'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Mail,
  MailOpen,
  Star,
  Archive,
  Trash2,
  Forward,
  Reply,
  MoreHorizontal,
  Search,
  Filter,
  Bot,
  Clock,
  AlertCircle,
  CheckCircle,
  Users,
  TrendingUp,
  Zap
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { EmailManagementService, EmailMessage } from '@/lib/email/EmailManagementService'
import { toast } from 'sonner'
export default function EmailManagementDashboard() {
  const { user } = useAuth()
  const [emails, setEmails] = useState<EmailMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('inbox')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [emailSummary, setEmailSummary] = useState<any>(null)
  const emailService = user ? new EmailManagementService(user.id) : null
  useEffect(() => {
    if (emailService) {
      loadEmailData()
    }
  }, [emailService])
  const loadEmailData = async () => {
    if (!emailService) return
    try {
      setLoading(true)
      // In a real implementation, these would fetch actual email data
      const summary = await emailService.getEmailSummary('today')
      setEmailSummary(summary)
      // Mock email data for demonstration
      const mockEmails: EmailMessage[] = [
        {
          id: '1',
          messageId: 'msg_1',
          from: 'client@example.com',
          to: ['tax@company.com'],
          subject: 'Question about Q3 tax estimates',
          body: 'Hi, I have a question about my Q3 estimated tax payments. Can we schedule a call to discuss?',
          attachments: [],
          receivedAt: new Date(),
          isRead: false,
          isImportant: true,
          labels: ['tax_question'],
          clientId: 'client_1',
          aiSummary: 'Client inquiry about Q3 estimated tax payments, requesting consultation call',
          aiCategory: 'tax_question',
          aiPriority: 'high',
          aiActionItems: ['Schedule consultation call', 'Review Q3 estimates'],
          processedAt: new Date()
        },
        {
          id: '2',
          messageId: 'msg_2',
          from: 'vendor@supplier.com',
          to: ['accounting@company.com'],
          subject: 'Invoice #12345 - Payment Due',
          body: 'Please find attached invoice #12345 for services rendered. Payment is due within 30 days.',
          attachments: [{ id: 'att_1', filename: 'invoice_12345.pdf', contentType: 'application/pdf', size: 245760 }],
          receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          isRead: true,
          isImportant: false,
          labels: ['invoice'],
          aiSummary: 'Invoice payment request from vendor, 30-day payment terms',
          aiCategory: 'payment',
          aiPriority: 'medium',
          aiActionItems: ['Process payment', 'Update accounts payable'],
          processedAt: new Date()
        }
      ]
      setEmails(mockEmails)
    } catch (error) {
      toast.error('Failed to load email data')
    } finally {
      setLoading(false)
    }
  }
  const filteredEmails = emails.filter(email => {
    const matchesSearch = email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.body.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || email.aiCategory === selectedCategory
    const matchesPriority = selectedPriority === 'all' || email.aiPriority === selectedPriority
    return matchesSearch && matchesCategory && matchesPriority
  })
  const handleEmailAction = async (action: string, emailId: string) => {
    // Implementation would handle email actions
    toast.success(`Email ${action} successfully`)
  }
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tax_question': return <AlertCircle className="w-4 h-4" />
      case 'document_request': return <Mail className="w-4 h-4" />
      case 'payment': return <CheckCircle className="w-4 h-4" />
      case 'appointment': return <Clock className="w-4 h-4" />
      default: return <Mail className="w-4 h-4" />
    }
  }
  const formatDate = (date: Date) => {
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading email management dashboard...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI-Powered Email Management</h1>
          <p className="text-muted-foreground">
            Intelligent email routing, summarization, and team collaboration
          </p>
        </div>
        <Button onClick={loadEmailData}>
          <Bot className="w-4 h-4 mr-2" />
          Process New Emails
        </Button>
      </div>
      {/* Summary Cards */}
      {emailSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{emailSummary.totalEmails}</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <MailOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{emailSummary.unreadEmails}</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgent</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{emailSummary.urgentEmails}</div>
              <p className="text-xs text-muted-foreground">High priority</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Auto-Routed</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {Object.values(emailSummary.teamWorkload).reduce((sum: number, count: unknown) => sum + (typeof count === 'number' ? count : 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">AI assignments</p>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="tax_question">Tax Questions</SelectItem>
                <SelectItem value="document_request">Document Requests</SelectItem>
                <SelectItem value="payment">Payments</SelectItem>
                <SelectItem value="appointment">Appointments</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="routing">Routing Rules</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="team">Team Performance</TabsTrigger>
        </TabsList>
        <TabsContent value="inbox" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Inbox ({filteredEmails.length})</CardTitle>
              <CardDescription>
                AI-processed emails with smart categorization and routing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>AI Summary</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmails.map((email) => (
                    <TableRow key={email.id} className={!email.isRead ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {!email.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                          {email.isImportant && <Star className="w-4 h-4 text-yellow-500" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{email.from}</div>
                          {email.attachments.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              📎 {email.attachments.length} attachment(s)
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate font-medium">{email.subject}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center space-x-1">
                          {getCategoryIcon(email.aiCategory || 'general')}
                          <span>{email.aiCategory || 'general'}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(email.aiPriority || 'medium')}`}></div>
                          <span className="capitalize">{email.aiPriority || 'medium'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm text-muted-foreground">
                          {email.aiSummary}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(email.receivedAt)}</div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEmailAction('reply', email.id)}>
                              <Reply className="w-4 h-4 mr-2" />
                              Reply
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEmailAction('forward', email.id)}>
                              <Forward className="w-4 h-4 mr-2" />
                              Forward
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEmailAction('archive', email.id)}>
                              <Archive className="w-4 h-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleEmailAction('delete', email.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredEmails.length === 0 && (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No emails found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="routing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Routing Rules</CardTitle>
              <CardDescription>
                Configure automatic email routing based on content and sender
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Email routing configuration will be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Analytics</CardTitle>
              <CardDescription>
                Insights into email volume, response times, and AI performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Email analytics and insights will be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
              <CardDescription>
                Monitor team response times and workload distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Team performance metrics will be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
