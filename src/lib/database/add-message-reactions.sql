-- Add message reactions table to existing messages system
-- Run this in your Supabase SQL Editor

-- Create message_reactions table for emoji reactions
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON public.message_reactions(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_reactions
CREATE POLICY "Users can view reactions in their conversations" ON public.message_reactions
  FOR SELECT USING (
    message_id IN (
      SELECT id FROM public.messages WHERE
        conversation_id IN (
          SELECT id FROM public.conversations WHERE
            client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()) OR
            admin_id = auth.uid() OR
            id IN (SELECT conversation_id FROM public.message_participants WHERE user_id = auth.uid())
        )
    )
  );

CREATE POLICY "Users can add reactions to messages in their conversations" ON public.message_reactions
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    message_id IN (
      SELECT id FROM public.messages WHERE
        conversation_id IN (
          SELECT id FROM public.conversations WHERE
            client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()) OR
            admin_id = auth.uid() OR
            id IN (SELECT conversation_id FROM public.message_participants WHERE user_id = auth.uid())
        )
    )
  );

CREATE POLICY "Users can remove their own reactions" ON public.message_reactions
  FOR DELETE USING (user_id = auth.uid());
