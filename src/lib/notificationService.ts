import { supabase } from './supabase'

export interface NotificationData {
  user_id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'task' | 'client' | 'document' | 'deadline'
  title: string
  message: string
  action_url?: string
  action_label?: string
  metadata?: Record<string, any>
}

export class NotificationService {
  static async createNotification(data: NotificationData) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: data.user_id,
          type: data.type,
          title: data.title,
          message: data.message,
          action_url: data.action_url,
          action_label: data.action_label,
          metadata: data.metadata || {},
          read: false,
          archived: false
        })

      if (error) throw error
      console.log('Notification created:', data.title)
    } catch (error) {
      console.error('Error creating notification:', error)
    }
  }

  static async notifyTaskCompleted(userId: string, taskTitle: string, clientName?: string) {
    await this.createNotification({
      user_id: userId,
      type: 'success',
      title: 'Task Completed',
      message: `"${taskTitle}" has been completed${clientName ? ` for ${clientName}` : ''}`,
      action_url: '/dashboard/tasks',
      action_label: 'View Tasks'
    })
  }

  static async notifyTaskOverdue(userId: string, taskTitle: string, clientName?: string) {
    await this.createNotification({
      user_id: userId,
      type: 'warning',
      title: 'Task Overdue',
      message: `"${taskTitle}" is overdue${clientName ? ` for ${clientName}` : ''}`,
      action_url: '/dashboard/tasks',
      action_label: 'View Tasks'
    })
  }

  static async notifyNewClient(userId: string, clientName: string, clientId: string) {
    await this.createNotification({
      user_id: userId,
      type: 'client',
      title: 'New Client Onboarded',
      message: `${clientName} has completed the intake process and is ready for service`,
      action_url: `/dashboard/clients/${clientId}`,
      action_label: 'View Client'
    })
  }

  static async notifyDocumentUploaded(userId: string, documentName: string, clientName?: string, clientId?: string) {
    await this.createNotification({
      user_id: userId,
      type: 'document',
      title: 'New Document Uploaded',
      message: `${documentName} has been uploaded${clientName ? ` by ${clientName}` : ''}`,
      action_url: clientId ? `/dashboard/clients/${clientId}` : '/dashboard/documents',
      action_label: 'View Documents'
    })
  }

  static async notifyDeadlineApproaching(userId: string, description: string, daysLeft: number, actionUrl?: string) {
    await this.createNotification({
      user_id: userId,
      type: 'deadline',
      title: 'Deadline Approaching',
      message: `${description} is due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
      action_url: actionUrl || '/dashboard/tasks',
      action_label: 'View Details'
    })
  }

  static async notifyClientStatusChange(userId: string, clientName: string, newStatus: string, clientId: string) {
    await this.createNotification({
      user_id: userId,
      type: 'info',
      title: 'Client Status Updated',
      message: `${clientName} has moved to ${newStatus.replace('_', ' ')} stage`,
      action_url: `/dashboard/clients/${clientId}`,
      action_label: 'View Client'
    })
  }

  static async notifyFormGenerated(userId: string, formType: string, clientName: string, clientId: string) {
    await this.createNotification({
      user_id: userId,
      type: 'success',
      title: 'Tax Form Generated',
      message: `${formType} has been generated for ${clientName}`,
      action_url: `/dashboard/clients/${clientId}`,
      action_label: 'Review Form'
    })
  }

  static async notifySystemUpdate(userId: string, updateTitle: string, updateMessage: string) {
    await this.createNotification({
      user_id: userId,
      type: 'info',
      title: updateTitle,
      message: updateMessage,
      action_url: '/dashboard',
      action_label: 'Learn More'
    })
  }

  static async notifyError(userId: string, errorTitle: string, errorMessage: string, actionUrl?: string) {
    await this.createNotification({
      user_id: userId,
      type: 'error',
      title: errorTitle,
      message: errorMessage,
      action_url: actionUrl,
      action_label: actionUrl ? 'View Details' : undefined
    })
  }

  // Bulk notification methods
  static async notifyMultipleUsers(userIds: string[], notificationData: Omit<NotificationData, 'user_id'>) {
    const notifications = userIds.map(userId => ({
      ...notificationData,
      user_id: userId,
      read: false,
      archived: false
    }))

    try {
      const { error } = await supabase
        .from('notifications')
        .insert(notifications)

      if (error) throw error
      console.log(`Bulk notification sent to ${userIds.length} users:`, notificationData.title)
    } catch (error) {
      console.error('Error creating bulk notifications:', error)
    }
  }

  // Automated notification triggers
  static async checkAndNotifyOverdueTasks() {
    try {
      // Get overdue tasks
      const { data: overdueTasks, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          user_id,
          due_date,
          clients (name)
        `)
        .lt('due_date', new Date().toISOString())
        .eq('status', 'pending')

      if (error) throw error

      // Create notifications for overdue tasks
      for (const task of overdueTasks || []) {
        await this.notifyTaskOverdue(
          task.user_id,
          task.title,
          Array.isArray(task.clients) ? (task.clients[0] as any)?.name : (task.clients as any)?.name
        )
      }
    } catch (error) {
      console.error('Error checking overdue tasks:', error)
    }
  }

  static async checkAndNotifyUpcomingDeadlines() {
    try {
      const threeDaysFromNow = new Date()
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

      // Get tasks due in next 3 days
      const { data: upcomingTasks, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          user_id,
          due_date,
          clients (name, id)
        `)
        .gte('due_date', new Date().toISOString())
        .lte('due_date', threeDaysFromNow.toISOString())
        .eq('status', 'pending')

      if (error) throw error

      // Create notifications for upcoming deadlines
      for (const task of upcomingTasks || []) {
        const dueDate = new Date(task.due_date)
        const daysLeft = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

        await this.notifyDeadlineApproaching(
          task.user_id,
          `Task: ${task.title}${Array.isArray(task.clients) ? ((task.clients[0] as any)?.name ? ` for ${(task.clients[0] as any).name}` : '') : ((task.clients as any)?.name ? ` for ${(task.clients as any).name}` : '')}`,
          daysLeft,
          Array.isArray(task.clients) ? ((task.clients[0] as any)?.id ? `/dashboard/clients/${(task.clients[0] as any).id}` : '/dashboard/tasks') : ((task.clients as any)?.id ? `/dashboard/clients/${(task.clients as any).id}` : '/dashboard/tasks')
        )
      }
    } catch (error) {
      console.error('Error checking upcoming deadlines:', error)
    }
  }

  // Integration with existing systems
  static async integrateWithTaskCompletion(taskId: string, userId: string) {
    try {
      // Get task details
      const { data: task, error } = await supabase
        .from('tasks')
        .select(`
          title,
          clients (name)
        `)
        .eq('id', taskId)
        .single()

      if (error) throw error

      if (task) {
        await this.notifyTaskCompleted(
          userId,
          task.title,
          Array.isArray(task.clients) ? (task.clients[0] as any)?.name : (task.clients as any)?.name
        )
      }
    } catch (error) {
      console.error('Error integrating with task completion:', error)
    }
  }

  static async integrateWithClientCreation(clientId: string, userId: string) {
    try {
      // Get client details
      const { data: client, error } = await supabase
        .from('clients')
        .select('name')
        .eq('id', clientId)
        .single()

      if (error) throw error

      if (client) {
        await this.notifyNewClient(userId, client.name, clientId)
      }
    } catch (error) {
      console.error('Error integrating with client creation:', error)
    }
  }

  static async integrateWithDocumentUpload(documentId: string, userId: string) {
    try {
      // Get document details
      const { data: document, error } = await supabase
        .from('documents')
        .select(`
          name,
          client_id,
          clients (name)
        `)
        .eq('id', documentId)
        .single()

      if (error) throw error

      if (document) {
        await this.notifyDocumentUploaded(
          userId,
          document.name,
          Array.isArray(document.clients) ? (document.clients[0] as any)?.name : (document.clients as any)?.name,
          document.client_id
        )
      }
    } catch (error) {
      console.error('Error integrating with document upload:', error)
    }
  }

  // Cleanup old notifications
  static async cleanupOldNotifications(daysOld: number = 30) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .eq('archived', true)

      if (error) throw error
      console.log(`Cleaned up notifications older than ${daysOld} days`)
    } catch (error) {
      console.error('Error cleaning up old notifications:', error)
    }
  }
}
