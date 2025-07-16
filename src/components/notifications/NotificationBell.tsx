'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Bell,
  BellRing,
  Check,
  Settings,
  Phone,
  Users,
  DollarSign,
  Target,
  Zap,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface Notification {
  id: string
  type: string
  priority: string
  title: string
  message: string
  read: boolean
  created_at: string
  action_url?: string
  action_label?: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadNotifications()
    
    // Set up polling for new notifications
    const interval = setInterval(loadNotifications, 30000) // Poll every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=10&unreadOnly=false')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_read',
          notificationIds: [notificationId]
        }),
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    setIsLoading(true)
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_read',
          notificationIds: unreadIds
        }),
      })

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'call': return Phone
      case 'lead': return Users
      case 'billing': return DollarSign
      case 'campaign': return Target
      case 'workflow': return Zap
      case 'system': return Settings
      default: return Bell
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500'
      case 'high': return 'text-orange-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-blue-500'
      default: return 'text-gray-500'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return AlertTriangle
      case 'high': return XCircle
      case 'medium': return Info
      case 'low': return CheckCircle
      default: return Info
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    
    if (notification.action_url) {
      window.location.href = notification.action_url
    }
    
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              disabled={isLoading}
              className="h-6 text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <ScrollArea className="h-80">
            <div className="space-y-1">
              {notifications.map((notification) => {
                const NotificationIcon = getNotificationIcon(notification.type)
                const PriorityIcon = getPriorityIcon(notification.priority)
                
                return (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`p-3 cursor-pointer ${
                      !notification.read ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-muted'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3 w-full">
                      <div className={`p-1.5 rounded-lg ${
                        notification.priority === 'urgent' ? 'bg-red-500' :
                        notification.priority === 'high' ? 'bg-orange-500' :
                        notification.priority === 'medium' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}>
                        <NotificationIcon className="h-3 w-3 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm leading-tight truncate">
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <PriorityIcon className={`h-3 w-3 ${getPriorityColor(notification.priority)}`} />
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                          {notification.action_label && (
                            <span className="text-xs text-primary font-medium">
                              {notification.action_label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </div>
          </ScrollArea>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="text-center justify-center"
          onClick={() => {
            window.location.href = '/dashboard/notifications'
            setIsOpen(false)
          }}
        >
          <Settings className="h-4 w-4 mr-2" />
          View All Notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
