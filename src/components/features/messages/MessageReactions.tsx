'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Smile, Plus } from 'lucide-react'

export interface MessageReaction {
  emoji: string
  count: number
  users: string[]
  hasReacted: boolean
}

interface MessageReactionsProps {
  messageId: string
  reactions: MessageReaction[]
  currentUserId: string
  onAddReaction: (messageId: string, emoji: string) => void
  onRemoveReaction: (messageId: string, emoji: string) => void
  disabled?: boolean
}

const COMMON_EMOJIS = [
  '👍', '👎', '❤️', '😂', '😮', '😢', '😡', '🎉', '👏', '🔥',
  '💯', '✅', '❌', '⭐', '💡', '🤔', '👀', '🙏', '💪', '🎯'
]

export function MessageReactions({
  messageId,
  reactions,
  currentUserId,
  onAddReaction,
  onRemoveReaction,
  disabled = false
}: MessageReactionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const handleReactionClick = (emoji: string, hasReacted: boolean) => {
    if (disabled) return
    
    if (hasReacted) {
      onRemoveReaction(messageId, emoji)
    } else {
      onAddReaction(messageId, emoji)
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    onAddReaction(messageId, emoji)
    setShowEmojiPicker(false)
  }

  if (reactions.length === 0 && disabled) {
    return null
  }

  return (
    <div className="flex items-center space-x-1 mt-1">
      {/* Existing reactions */}
      {reactions.map((reaction) => (
        <Button
          key={reaction.emoji}
          variant={reaction.hasReacted ? "default" : "outline"}
          size="sm"
          className={`h-6 px-2 text-xs ${
            reaction.hasReacted 
              ? 'bg-primary/20 border-primary/50 hover:bg-primary/30' 
              : 'hover:bg-muted'
          }`}
          onClick={() => handleReactionClick(reaction.emoji, reaction.hasReacted)}
          disabled={disabled}
          title={`${reaction.count} reaction${reaction.count !== 1 ? 's' : ''}`}
        >
          <span className="mr-1">{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </Button>
      ))}

      {/* Add reaction button */}
      {!disabled && (
        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
              title="Add reaction"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="grid grid-cols-5 gap-2">
              {COMMON_EMOJIS.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-lg hover:bg-muted"
                  onClick={() => handleEmojiSelect(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
