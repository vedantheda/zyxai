'use client'
import { useState } from 'react'
import { Conversation } from '@/lib/types/messages'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Search,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  Archive,
  Plus
} from 'lucide-react'
// import { formatDistanceToNow } from 'date-fns'
interface ConversationListProps {
  conversations: Conversation[]
  currentConversation?: Conversation | null
  onSelectConversation: (conversation: Conversation) => void
  onCreateConversation?: () => void
  loading?: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
}
export function ConversationList({
  conversations,
  currentConversation,
  onSelectConversation,
  onCreateConversation,
  loading = false,
  searchQuery = '',
  onSearchChange
}: ConversationListProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)
  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value)
    onSearchChange?.(value)
  }
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'normal': return 'bg-blue-500'
      case 'low': return 'bg-gray-500'
      default: return 'bg-blue-500'
    }
  }
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'closed': return <AlertCircle className="w-4 h-4 text-gray-500" />
      case 'archived': return <Archive className="w-4 h-4 text-gray-400" />
      default: return <MessageSquare className="w-4 h-4 text-blue-500" />
    }
  }
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  const filteredConversations = conversations.filter(conversation => {
    if (!localSearchQuery) return true
    const searchLower = localSearchQuery.toLowerCase()
    return (
      conversation.subject.toLowerCase().includes(searchLower) ||
      conversation.client?.name.toLowerCase().includes(searchLower) ||
      conversation.admin?.name.toLowerCase().includes(searchLower) ||
      (typeof conversation.lastMessage === 'string'
        ? conversation.lastMessage.toLowerCase().includes(searchLower)
        : conversation.lastMessage?.content?.toLowerCase().includes(searchLower))
    )
  })
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Messages</span>
          </CardTitle>
          {onCreateConversation && (
            <Button size="sm" onClick={onCreateConversation}>
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={localSearchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div className="h-full overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-3 p-3">
                    <div className="w-10 h-10 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No conversations found</p>
              <p className="text-sm">
                {localSearchQuery
                  ? 'Try adjusting your search terms'
                  : 'Start a new conversation to get started'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {filteredConversations.map((conversation) => {
                const isSelected = currentConversation?.id === conversation.id
                const participant = conversation.client || conversation.admin
                const hasUnread = (conversation.unreadCount || 0) > 0
                return (
                  <div
                    key={conversation.id}
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50 ${
                      isSelected ? 'bg-primary/10 border border-primary/20' : ''
                    }`}
                    onClick={() => onSelectConversation(conversation)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Avatar */}
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={participant?.avatarUrl} />
                          <AvatarFallback className="text-xs">
                            {participant ? getInitials(participant.name) : '?'}
                          </AvatarFallback>
                        </Avatar>
                        {/* Priority indicator */}
                        <div
                          className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getPriorityColor(conversation.priority)}`}
                          title={`${conversation.priority} priority`}
                        />
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`text-sm font-medium truncate ${
                            hasUnread ? 'font-semibold' : ''
                          }`}>
                            {participant?.name || 'Unknown User'}
                          </h4>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(conversation.status)}
                            {hasUnread && (
                              <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {conversation.lastMessage && (
                          <p className={`text-sm text-muted-foreground truncate mb-1 ${
                            hasUnread ? 'font-medium' : ''
                          }`}>
                            {typeof conversation.lastMessage === 'string'
                              ? conversation.lastMessage
                              : conversation.lastMessage.content}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(conversation.lastMessageAt).toLocaleDateString()}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
                            {conversation.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
