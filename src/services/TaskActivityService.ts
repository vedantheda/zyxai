import { supabase } from '@/lib/supabase'

export interface TaskActivity {
  id: string
  task_id: string
  user_id: string
  action: string
  details: any
  created_at: string
}

export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
}

export class TaskActivityService {
  /**
   * Log a task activity
   */
  static async logActivity(
    taskId: string,
    userId: string,
    action: string,
    details: any = {}
  ): Promise<{ data: TaskActivity | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('task_activities')
        .insert({
          task_id: taskId,
          user_id: userId,
          action,
          details
        })
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error logging task activity:', error)
      return { data: null, error }
    }
  }

  /**
   * Get activities for a task
   */
  static async getTaskActivities(taskId: string): Promise<{ data: TaskActivity[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('task_activities')
        .select(`
          *,
          profiles:user_id (
            name,
            email
          )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })

      return { data: data || [], error }
    } catch (error) {
      console.error('Error fetching task activities:', error)
      return { data: [], error }
    }
  }

  /**
   * Add a comment to a task
   */
  static async addComment(
    taskId: string,
    userId: string,
    content: string
  ): Promise<{ data: TaskComment | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          user_id: userId,
          content
        })
        .select()
        .single()

      if (!error && data) {
        // Log the comment activity
        await this.logActivity(taskId, userId, 'comment_added', {
          comment_id: data.id,
          content: content.substring(0, 100) + (content.length > 100 ? '...' : '')
        })
      }

      return { data, error }
    } catch (error) {
      console.error('Error adding task comment:', error)
      return { data: null, error }
    }
  }

  /**
   * Get comments for a task
   */
  static async getTaskComments(taskId: string): Promise<{ data: TaskComment[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .select(`
          *,
          profiles:user_id (
            name,
            email
          )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true })

      return { data: data || [], error }
    } catch (error) {
      console.error('Error fetching task comments:', error)
      return { data: [], error }
    }
  }

  /**
   * Update a comment
   */
  static async updateComment(
    commentId: string,
    content: string
  ): Promise<{ data: TaskComment | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .update({ content })
        .eq('id', commentId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error updating task comment:', error)
      return { data: null, error }
    }
  }

  /**
   * Delete a comment
   */
  static async deleteComment(commentId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('task_comments')
        .delete()
        .eq('id', commentId)

      return { error }
    } catch (error) {
      console.error('Error deleting task comment:', error)
      return { error }
    }
  }

  /**
   * Log task status change
   */
  static async logStatusChange(
    taskId: string,
    userId: string,
    oldStatus: string,
    newStatus: string,
    additionalDetails: any = {}
  ): Promise<void> {
    await this.logActivity(taskId, userId, 'status_changed', {
      old_status: oldStatus,
      new_status: newStatus,
      ...additionalDetails
    })
  }

  /**
   * Log task creation
   */
  static async logTaskCreation(
    taskId: string,
    userId: string,
    taskData: any
  ): Promise<void> {
    await this.logActivity(taskId, userId, 'task_created', {
      title: taskData.title,
      priority: taskData.priority,
      category: taskData.category,
      auto_generated: taskData.auto_generated,
      trigger_event: taskData.trigger_event
    })
  }

  /**
   * Log task completion
   */
  static async logTaskCompletion(
    taskId: string,
    userId: string,
    completionData: any = {}
  ): Promise<void> {
    await this.logActivity(taskId, userId, 'task_completed', {
      completion_time: new Date().toISOString(),
      ...completionData
    })
  }

  /**
   * Log task assignment
   */
  static async logTaskAssignment(
    taskId: string,
    userId: string,
    assignee: string,
    previousAssignee?: string
  ): Promise<void> {
    await this.logActivity(taskId, userId, 'task_assigned', {
      assignee,
      previous_assignee: previousAssignee
    })
  }

  /**
   * Log task priority change
   */
  static async logPriorityChange(
    taskId: string,
    userId: string,
    oldPriority: string,
    newPriority: string
  ): Promise<void> {
    await this.logActivity(taskId, userId, 'priority_changed', {
      old_priority: oldPriority,
      new_priority: newPriority
    })
  }

  /**
   * Log task due date change
   */
  static async logDueDateChange(
    taskId: string,
    userId: string,
    oldDueDate: string | null,
    newDueDate: string | null
  ): Promise<void> {
    await this.logActivity(taskId, userId, 'due_date_changed', {
      old_due_date: oldDueDate,
      new_due_date: newDueDate
    })
  }

  /**
   * Log task progress update
   */
  static async logProgressUpdate(
    taskId: string,
    userId: string,
    oldProgress: number,
    newProgress: number
  ): Promise<void> {
    await this.logActivity(taskId, userId, 'progress_updated', {
      old_progress: oldProgress,
      new_progress: newProgress
    })
  }

  /**
   * Log time tracking events
   */
  static async logTimeTracking(
    taskId: string,
    userId: string,
    action: 'started' | 'stopped' | 'paused',
    duration?: number
  ): Promise<void> {
    await this.logActivity(taskId, userId, `time_tracking_${action}`, {
      duration,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Get activity summary for a task
   */
  static async getActivitySummary(taskId: string): Promise<{
    total_activities: number
    comments_count: number
    status_changes: number
    last_activity: string | null
  }> {
    try {
      const { data: activities } = await this.getTaskActivities(taskId)
      const { data: comments } = await this.getTaskComments(taskId)

      const statusChanges = activities.filter(a => a.action === 'status_changed').length
      const lastActivity = activities.length > 0 ? activities[0].created_at : null

      return {
        total_activities: activities.length,
        comments_count: comments.length,
        status_changes,
        last_activity: lastActivity
      }
    } catch (error) {
      console.error('Error getting activity summary:', error)
      return {
        total_activities: 0,
        comments_count: 0,
        status_changes: 0,
        last_activity: null
      }
    }
  }
}
