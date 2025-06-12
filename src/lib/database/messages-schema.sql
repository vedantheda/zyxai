-- Messages System Database Schema
-- Run this in your Supabase SQL Editor to enable client-admin messaging

-- Create conversations table for message threads between clients and admins
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL DEFAULT 'General Discussion',
  status TEXT CHECK (status IN ('active', 'closed', 'archived')) DEFAULT 'active',
  priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table for individual messages within conversations
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_type TEXT CHECK (sender_type IN ('client', 'admin')) NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'file', 'system')) DEFAULT 'text',
  attachments JSONB DEFAULT '[]', -- Array of file attachments
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}', -- Additional message metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create message_participants table for tracking conversation participants
CREATE TABLE IF NOT EXISTS public.message_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('client', 'admin', 'observer')) NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Create message_attachments table for file attachments
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  is_image BOOLEAN DEFAULT FALSE,
  thumbnail_url TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON public.conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_admin_id ON public.conversations(admin_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);

CREATE INDEX IF NOT EXISTS idx_message_participants_conversation_id ON public.message_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_participants_user_id ON public.message_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON public.message_attachments(message_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view conversations they participate in" ON public.conversations
  FOR SELECT USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()) OR
    admin_id = auth.uid() OR
    id IN (SELECT conversation_id FROM public.message_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (admin_id = auth.uid());

CREATE POLICY "Participants can update conversations" ON public.conversations
  FOR UPDATE USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()) OR
    admin_id = auth.uid() OR
    id IN (SELECT conversation_id FROM public.message_participants WHERE user_id = auth.uid())
  );

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE
        client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()) OR
        admin_id = auth.uid() OR
        id IN (SELECT conversation_id FROM public.message_participants WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create messages in their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM public.conversations WHERE
        client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()) OR
        admin_id = auth.uid() OR
        id IN (SELECT conversation_id FROM public.message_participants WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid());

-- RLS Policies for message_participants
CREATE POLICY "Users can view their own participation" ON public.message_participants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage participants" ON public.message_participants
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE admin_id = auth.uid()
    )
  );

-- RLS Policies for message_attachments
CREATE POLICY "Users can view attachments in their conversations" ON public.message_attachments
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

CREATE POLICY "Users can upload attachments to their messages" ON public.message_attachments
  FOR INSERT WITH CHECK (uploaded_by = auth.uid());

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations 
  SET last_message_at = NEW.created_at, updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation timestamp when new message is added
CREATE TRIGGER update_conversation_last_message_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(conversation_id_param UUID, user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.messages 
  SET is_read = TRUE, read_at = NOW()
  WHERE conversation_id = conversation_id_param 
    AND sender_id != user_id_param 
    AND is_read = FALSE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Update participant's last_read_at
  UPDATE public.message_participants
  SET last_read_at = NOW()
  WHERE conversation_id = conversation_id_param AND user_id = user_id_param;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM public.messages m
  JOIN public.conversations c ON m.conversation_id = c.id
  WHERE m.sender_id != user_id_param 
    AND m.is_read = FALSE
    AND (
      c.client_id IN (SELECT id FROM public.clients WHERE user_id = user_id_param) OR
      c.admin_id = user_id_param OR
      c.id IN (SELECT conversation_id FROM public.message_participants WHERE user_id = user_id_param)
    );
  
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql;
