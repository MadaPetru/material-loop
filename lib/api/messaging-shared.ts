import type { ChatMessage, Conversation, ConversationWithMeta, Profile } from '@/lib/types';

export function mapConversationRow(row: {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  created_at: string;
}): Conversation {
  return {
    id: row.id,
    listingId: row.listing_id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
  };
}

export function mapMessageRow(row: {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

export function otherParticipantId(conversation: Conversation, userId: string) {
  return conversation.buyerId === userId ? conversation.sellerId : conversation.buyerId;
}

export function withMeta(
  conversation: Conversation,
  opts: {
    userId: string;
    otherUser?: Profile | null;
    listingTitle?: string;
    listingPhotoUrl?: string | null;
    lastMessageBody?: string | null;
  }
): ConversationWithMeta {
  return {
    ...conversation,
    otherUser: opts.otherUser ?? null,
    listingTitle: opts.listingTitle,
    listingPhotoUrl: opts.listingPhotoUrl ?? null,
    lastMessageBody: opts.lastMessageBody ?? null,
  };
}
