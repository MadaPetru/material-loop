import type { ChatMessage, Conversation, ConversationWithMeta, Profile } from '@/lib/types';

export function mapConversationRow(row: {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  created_at: string;
  buyer_last_read_at?: string | null;
  seller_last_read_at?: string | null;
}): Conversation {
  return {
    id: row.id,
    listingId: row.listing_id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
    buyerLastReadAt: row.buyer_last_read_at ?? null,
    sellerLastReadAt: row.seller_last_read_at ?? null,
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

export function lastReadAtFor(conversation: Conversation, userId: string) {
  return conversation.buyerId === userId
    ? conversation.buyerLastReadAt
    : conversation.sellerLastReadAt;
}

export function isConversationUnread(
  conversation: Conversation,
  userId: string,
  lastMessageSenderId: string | null | undefined
) {
  if (!lastMessageSenderId || lastMessageSenderId === userId) return false;
  const lastRead = lastReadAtFor(conversation, userId);
  if (!lastRead) return true;
  return conversation.lastMessageAt > lastRead;
}

export function withMeta(
  conversation: Conversation,
  opts: {
    userId: string;
    otherUser?: Profile | null;
    listingTitle?: string;
    listingPhotoUrl?: string | null;
    listingCategoryId?: string | null;
    listingSubcategoryId?: string | null;
    lastMessageBody?: string | null;
    lastMessageSenderId?: string | null;
  }
): ConversationWithMeta {
  const lastMessageSenderId = opts.lastMessageSenderId ?? null;
  return {
    ...conversation,
    otherUser: opts.otherUser ?? null,
    listingTitle: opts.listingTitle,
    listingPhotoUrl: opts.listingPhotoUrl ?? null,
    listingCategoryId: opts.listingCategoryId ?? null,
    listingSubcategoryId: opts.listingSubcategoryId ?? null,
    lastMessageBody: opts.lastMessageBody ?? null,
    lastMessageSenderId,
    unread: isConversationUnread(conversation, opts.userId, lastMessageSenderId),
  };
}
