export type ChatListItemDto = {
  taskId: string;
  taskTitle: string;
  hasNewMessages: boolean;
};

export type ChatsListDto = {
  chats: ChatListItemDto[];
  offset: number;
  limit: number;
  hasMore: boolean;
};

export type ChatSenderDto = {
  id: string;
  name: string;
};

export type ChatMessageDto = {
  id: string;
  sender: ChatSenderDto;
  message: string;
  createdAt: string; // ISO
  isNew: boolean;
};

export type ChatMessagesListDto = {
  messages: ChatMessageDto[];
  offset: number;
  limit: number;
  hasMore: boolean;
};