'use client'
import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Brain,
  Send,
  Paperclip,
  MoreHorizontal,
  FileText,
  Calculator,
  Search,
  Lightbulb,
  TrendingUp,
  Users,
  Clock,
  MessageSquare,
  Plus,
  Trash2,
  Edit,
  Upload,
  BarChart3,
  Copy,
  RefreshCw,
  Settings,
  HelpCircle,
  Zap,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react'
import { useAIAssistant } from '@/hooks/useAIAssistant'
import { useFileStorage } from '@/hooks/useFileStorage'
import { useClients, useDocuments } from '@/hooks/useSimpleData'
import { toast } from 'sonner'
const quickActions = [
  {
    title: 'Document Analysis',
    description: 'Upload and analyze tax documents',
    icon: FileText,
    color: 'text-blue-500',
    action: 'analyzeLatestDocuments'
  },
  {
    title: 'Tax Calculations',
    description: 'Perform complex tax calculations',
    icon: Calculator,
    color: 'text-green-500',
    action: 'calculateQuarterlyTaxes'
  },
  {
    title: 'Client Research',
    description: 'Look up client information and history',
    icon: Search,
    color: 'text-purple-500',
    action: 'getUpcomingDeadlines'
  },
  {
    title: 'Tax Planning',
    description: 'Generate tax planning strategies',
    icon: Lightbulb,
    color: 'text-orange-500',
    action: 'generateTaxPlanningStrategy'
  }
]
export default function AIAssistantPage() {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [renamingConversation, setRenamingConversation] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [showTypingAnimation, setShowTypingAnimation] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const shouldAutoScroll = useRef(true)
  const {
    conversations,
    currentConversation,
    isLoading,
    isAnalyzing,
    error,
    sendMessage,
    analyzeDocument,
    createNewConversation,
    deleteConversation,
    updateConversationTitle,
    setCurrentConversation,
    quickActions: aiQuickActions,
    clearError
  } = useAIAssistant()
  const { uploadFile } = useFileStorage({ autoRefresh: true })
  const { data: clients } = useClients()
  const { data: documents } = useDocuments()
  // Memoize stats calculation for performance
  const stats = useMemo(() => [
    {
      title: 'Conversations',
      value: conversations.length.toString(),
      icon: MessageSquare,
      change: conversations.length > 0 ? `+${conversations.length}` : '0',
      color: 'text-blue-600'
    },
    {
      title: 'Messages Today',
      value: currentConversation?.messages.length.toString() || '0',
      icon: MessageSquare,
      change: currentConversation?.messages.length ? `+${currentConversation.messages.length}` : '0',
      color: 'text-green-600'
    },
    {
      title: 'Documents',
      value: documents.length.toString(),
      icon: FileText,
      change: documents.length > 0 ? `+${documents.length}` : '0',
      color: 'text-purple-600'
    },
    {
      title: 'Clients',
      value: clients.length.toString(),
      icon: Users,
      change: clients.length > 0 ? `+${clients.length}` : '0',
      color: 'text-orange-600'
    },
  ], [conversations.length, currentConversation?.messages.length, documents.length, clients.length])
  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || isLoading) return
    const messageToSend = message.trim()
    setMessage('')
    setIsTyping(true)
    setShowTypingAnimation(true)
    shouldAutoScroll.current = true
    try {
      await sendMessage(messageToSend)
      // Enable auto-scroll for AI response
      shouldAutoScroll.current = true
    } catch (error) {
      toast.error('Failed to send message', {
        description: 'Please check your connection and try again',
        duration: 4000,
      })
      setMessage(messageToSend) // Restore message on error
    } finally {
      setIsTyping(false)
      setShowTypingAnimation(false)
    }
  }, [message, sendMessage, isLoading])
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
    // Ctrl/Cmd + Enter also sends message
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])
  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
  }, [])
  const handleSuggestedPrompt = useCallback((prompt: string) => {
    setMessage(prompt)
  }, [])
  const handleRenameConversation = useCallback(async (conversationId: string, title: string) => {
    try {
      await updateConversationTitle(conversationId, title)
      toast.success('Conversation renamed!', {
        description: `Now called "${title}"`,
        duration: 2000,
      })
      setRenamingConversation(null)
      setNewTitle('')
    } catch (error) {
      toast.error('Failed to rename conversation', {
        description: 'Please try again',
        duration: 3000,
      })
    }
  }, [updateConversationTitle])
  const startRename = useCallback((conversation: { id: string; title: string }) => {
    setRenamingConversation(conversation.id)
    setNewTitle(conversation.title)
  }, [])
  const handleQuickAction = useCallback(async (actionKey: string) => {
    try {
      // Ensure we have a conversation first
      if (!currentConversation) {
        await createNewConversation()
        // Wait a bit for the conversation to be created
        await new Promise(resolve => setTimeout(resolve, 200))
        // Scroll to show the welcome message
        shouldAutoScroll.current = true
      }
      const actionMap = {
        analyzeLatestDocuments: aiQuickActions.analyzeLatestDocuments,
        calculateQuarterlyTaxes: aiQuickActions.calculateQuarterlyTaxes,
        getUpcomingDeadlines: aiQuickActions.getUpcomingDeadlines,
        generateTaxPlanningStrategy: aiQuickActions.generateTaxPlanningStrategy
      }
      const action = actionMap[actionKey as keyof typeof actionMap]
      if (action) {
        shouldAutoScroll.current = true
        await action()
        toast.success('Action completed successfully!')
      } else {
        toast.error('Unknown action')
      }
    } catch (error) {
      toast.error('Failed to execute action. Please try again.')
    }
  }, [aiQuickActions, currentConversation, createNewConversation])
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File too large', {
        description: 'Please select a file smaller than 10MB',
        duration: 4000,
      })
      return
    }
    setUploadProgress(0)
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)
      const result = await uploadFile(file, { category: 'ai_analysis' })
      clearInterval(progressInterval)
      setUploadProgress(100)
      if (result.success && result.data) {
        await analyzeDocument(result.data.id)
        toast.success('Document uploaded successfully!', {
          description: `${file.name} has been analyzed and is ready for AI insights`,
          duration: 3000,
        })
        // Add a message about the upload
        await sendMessage(`I've uploaded and analyzed the document "${file.name}". Please provide insights about this document.`)
      } else {
        toast.error('Upload failed', {
          description: result.error || 'Please try again with a different file',
          duration: 4000,
        })
      }
    } catch (error) {
      toast.error('Upload failed', {
        description: 'Please check your connection and try again',
        duration: 4000,
      })
    } finally {
      // Reset after delay
      setTimeout(() => setUploadProgress(0), 2000)
      if (event.target) {
        event.target.value = ''
      }
    }
  }, [uploadFile, analyzeDocument, sendMessage])
  // Memoized timestamp formatter for performance
  const formatTimestamp = useCallback((timestamp: Date | string | number) => {
    try {
      // Ensure we have a proper Date object
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date'
      }
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch (error) {
      return 'Invalid date'
    }
  }, [])
  // Copy message to clipboard
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Message copied to clipboard!', {
        description: 'You can now paste it anywhere',
        duration: 2000,
      })
    } catch (error) {
      toast.error('Failed to copy to clipboard', {
        description: 'Please try again or copy manually',
        duration: 3000,
      })
    }
  }, [])
  // Format message content with basic markdown-like formatting
  const formatMessageContent = useCallback((content: string) => {
    // Split by lines to preserve line breaks
    const lines = content.split('\n')
    return lines.map((line, lineIndex) => {
      // Handle bullet points
      if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
        return (
          <div key={lineIndex} className="flex items-start space-x-2 my-1">
            <span className="text-primary mt-1">•</span>
            <span>{line.replace(/^[•\-*]\s*/, '')}</span>
          </div>
        )
      }
      // Handle numbered lists
      if (/^\d+\.\s/.test(line.trim())) {
        const match = line.match(/^(\d+)\.\s(.*)/)
        if (match) {
          return (
            <div key={lineIndex} className="flex items-start space-x-2 my-1">
              <span className="text-primary font-medium">{match[1]}.</span>
              <span>{match[2]}</span>
            </div>
          )
        }
      }
      // Handle bold text **text**
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Handle headers (lines starting with #)
      if (line.trim().startsWith('#')) {
        const headerLevel = (line.match(/^#+/) || [''])[0].length
        const headerText = line.replace(/^#+\s*/, '')
        const headerClass = headerLevel === 1 ? 'text-lg font-bold' :
                           headerLevel === 2 ? 'text-base font-semibold' :
                           'text-sm font-medium'
        return (
          <div key={lineIndex} className={`${headerClass} my-2 text-foreground`}>
            {headerText}
          </div>
        )
      }
      // Handle empty lines
      if (line.trim() === '') {
        return <div key={lineIndex} className="h-2" />
      }
      // Regular line with bold formatting
      return (
        <div
          key={lineIndex}
          className="my-1"
          dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      )
    })
  }, [])
  // Typing animation component
  const TypingAnimation = () => (
    <div className="flex items-center space-x-1">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span className="text-sm text-muted-foreground ml-2">AI is thinking...</span>
    </div>
  )
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const scrollToBottom = () => {
      // Find the ScrollArea viewport (it's a div with data-radix-scroll-area-viewport)
      const scrollAreaViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
      if (scrollAreaViewport) {
        // Always scroll when messages change during active chat
        if (shouldAutoScroll.current || isLoading || isTyping || showTypingAnimation) {
          // Smooth scroll when user is actively chatting
          scrollAreaViewport.scrollTo({
            top: scrollAreaViewport.scrollHeight,
            behavior: 'smooth'
          })
        } else if (currentConversation?.messages.length === 1) {
          // Instant scroll for first message (welcome message)
          scrollAreaViewport.scrollTo({
            top: scrollAreaViewport.scrollHeight,
            behavior: 'auto'
          })
        }
      }
      // Reset auto-scroll flag after a delay, but keep it active during typing
      if (shouldAutoScroll.current && !isLoading && !isTyping && !showTypingAnimation) {
        setTimeout(() => {
          shouldAutoScroll.current = false
        }, 300)
      }
    }
    // Small delay to ensure DOM is updated
    setTimeout(scrollToBottom, 50)
  }, [currentConversation?.messages, isLoading, isTyping, showTypingAnimation])
  // Don't auto-scroll when switching conversations (let user see from top)
  useEffect(() => {
    shouldAutoScroll.current = false
  }, [currentConversation?.id])
  // Clear error when component mounts
  useEffect(() => {
    if (error) {
      toast.error(error)
      clearError()
    }
  }, [error, clearError])
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Brain className="w-8 h-8 mr-3 text-primary" />
            Neuronize AI Assistant
          </h1>
          <p className="text-muted-foreground">Your intelligent tax practice assistant powered by advanced AI</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Online
          </Badge>
          {isLoading && (
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Processing
            </Badge>
          )}
          {isAnalyzing && (
            <Badge variant="outline" className="text-purple-600 border-purple-600">
              <Zap className="w-3 h-3 mr-1 animate-pulse" />
              Analyzing
            </Badge>
          )}
          {error && (
            <Badge variant="outline" className="text-red-600 border-red-600">
              <AlertCircle className="w-3 h-3 mr-1" />
              Error
            </Badge>
          )}
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={stat.color}>{stat.change}</span> total
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Upload Progress */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <Alert>
          <Upload className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>Uploading and analyzing document...</p>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-xs text-muted-foreground">{uploadProgress}% complete</p>
            </div>
          </AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Conversations Sidebar */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Conversations</CardTitle>
                <CardDescription>Chat history</CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  createNewConversation()
                  shouldAutoScroll.current = true
                }}
                disabled={isLoading}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      currentConversation?.id === conversation.id
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setCurrentConversation(conversation)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {conversation.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {conversation.messages.length} messages
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => startRename(conversation)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteConversation(conversation.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
                {conversations.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      No conversations yet
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
            {/* Quick Actions */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-3">Quick Actions</p>
              <div className="space-y-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.title}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start h-auto p-3"
                    onClick={() => handleQuickAction(action.action)}
                    disabled={isLoading}
                  >
                    <div className="flex items-start space-x-2">
                      <action.icon className={`w-4 h-4 ${action.color} mt-0.5`} />
                      <div className="text-left">
                        <div className="font-medium text-xs">{action.title}</div>
                        <div className="text-xs text-muted-foreground">{action.description}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Chat Interface */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle>Neuronize AI</CardTitle>
                  <CardDescription>Tax practice AI assistant</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Chat Messages */}
            <ScrollArea ref={scrollAreaRef} className="h-96 mb-4 p-4 border rounded-lg bg-accent/20">
              <div className="space-y-4">
                {currentConversation?.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg group relative ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background border'
                      }`}
                    >
                      <div className="text-sm">
                        {formatMessageContent(message.content)}
                      </div>
                      <div className={`flex items-center justify-between mt-2 ${
                        message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        <span className="text-xs">
                          {formatTimestamp(message.timestamp)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                          onClick={() => copyToClipboard(message.content)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {(isLoading || isTyping || showTypingAnimation) && (
                  <div className="flex justify-start">
                    <div className="bg-background border p-3 rounded-lg">
                      {isAnalyzing ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">Analyzing document...</span>
                        </div>
                      ) : (
                        <TypingAnimation />
                      )}
                    </div>
                  </div>
                )}
                {!currentConversation && (
                  <div className="text-center py-8">
                    <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Welcome to Neuronize AI</h3>
                    <p className="text-muted-foreground mb-6">
                      Start a new conversation to begin chatting with your AI tax assistant
                    </p>
                    <Button
                      onClick={() => {
                        createNewConversation()
                        shouldAutoScroll.current = true
                      }}
                      disabled={isLoading}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Start New Conversation
                    </Button>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            {/* Message Input */}
            <div className="space-y-3">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <Textarea
                    placeholder={currentConversation
                      ? "Ask me anything about tax preparation, document analysis, or client management... (Press Enter to send, Shift+Enter for new line)"
                      : "Start a new conversation to begin chatting..."}
                    value={message}
                    onChange={handleMessageChange}
                    onKeyPress={handleKeyPress}
                    className="min-h-[60px] resize-none"
                    disabled={isLoading || !currentConversation}
                    maxLength={2000}
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isLoading || !currentConversation}
                        title="Attach files or data"
                      >
                        <Paperclip className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Document
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSuggestedPrompt('Show me my latest client data and document statistics')}>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Attach Client Data
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSuggestedPrompt('Help me with tax calculations')}>
                        <Calculator className="w-4 h-4 mr-2" />
                        Tax Calculator
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !message.trim() || !currentConversation}
                    title={!currentConversation ? "Start a new conversation first" : "Send message"}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              {/* Character count and status */}
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>{message.length}/2000 characters</span>
                <div className="flex items-center space-x-2">
                  {currentConversation && (
                    <span className="flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                      Ready to chat
                    </span>
                  )}
                  {!currentConversation && (
                    <span className="flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1 text-orange-500" />
                      No active conversation
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* Hidden file input */}
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt"
              onChange={handleFileUpload}
              className="hidden"
              ref={fileInputRef}
            />
            {/* Suggested Prompts */}
            {currentConversation && currentConversation.messages.length === 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-3 text-muted-foreground">Suggested prompts to get started:</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestedPrompt('Analyze my latest uploaded documents and provide insights')}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    Analyze documents
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestedPrompt('Calculate estimated quarterly taxes for my clients')}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    <Calculator className="w-3 h-3 mr-1" />
                    Calculate taxes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestedPrompt('Show me clients with upcoming tax deadlines')}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    Upcoming deadlines
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestedPrompt('Generate a comprehensive tax planning strategy')}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    <Lightbulb className="w-3 h-3 mr-1" />
                    Tax planning
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestedPrompt('Help me review client status and provide recommendations')}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    <Users className="w-3 h-3 mr-1" />
                    Client insights
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {/* AI Capabilities */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2 text-primary" />
                AI Capabilities
              </CardTitle>
              <CardDescription>What your Neuronize AI assistant can help you with</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => handleSuggestedPrompt('Help me analyze my latest tax documents')}>
              <FileText className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <h4 className="font-medium mb-1">Document Analysis</h4>
              <p className="text-sm text-muted-foreground">Extract data from tax documents with high accuracy using OCR and AI</p>
              <Badge variant="secondary" className="mt-2 text-xs">Click to try</Badge>
            </div>
            <div className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => handleSuggestedPrompt('Calculate taxes for my clients')}>
              <Calculator className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <h4 className="font-medium mb-1">Tax Calculations</h4>
              <p className="text-sm text-muted-foreground">Perform complex tax calculations, projections, and scenario analysis</p>
              <Badge variant="secondary" className="mt-2 text-xs">Click to try</Badge>
            </div>
            <div className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => handleSuggestedPrompt('Provide insights about my clients')}>
              <Users className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <h4 className="font-medium mb-1">Client Insights</h4>
              <p className="text-sm text-muted-foreground">Generate personalized insights and recommendations for each client</p>
              <Badge variant="secondary" className="mt-2 text-xs">Click to try</Badge>
            </div>
            <div className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => handleSuggestedPrompt('Create a tax planning strategy')}>
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <h4 className="font-medium mb-1">Tax Planning</h4>
              <p className="text-sm text-muted-foreground">Create strategic tax planning and optimization recommendations</p>
              <Badge variant="secondary" className="mt-2 text-xs">Click to try</Badge>
            </div>
          </div>
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center mb-2">
              <Brain className="w-4 h-4 mr-2 text-primary" />
              <span className="font-medium text-sm">Powered by Advanced AI</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Neuronize AI uses state-of-the-art language models and specialized tax knowledge to provide accurate,
              professional assistance for your tax practice. All data is processed securely and confidentially.
            </p>
          </div>
        </CardContent>
      </Card>
      {/* Rename Conversation Dialog */}
      <Dialog open={!!renamingConversation} onOpenChange={() => setRenamingConversation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Conversation</DialogTitle>
            <DialogDescription>
              Enter a new name for this conversation.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Conversation title"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newTitle.trim() && renamingConversation) {
                  handleRenameConversation(renamingConversation, newTitle.trim())
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenamingConversation(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (newTitle.trim() && renamingConversation) {
                  handleRenameConversation(renamingConversation, newTitle.trim())
                }
              }}
              disabled={!newTitle.trim()}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
