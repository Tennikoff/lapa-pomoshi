// src/types/comment.ts
export type CommentSenderDto = {
  id: string; // uuid
  name: string;
};

export type CommentDto = {
  id: string; // uuid
  rating: number; // 1..5
  description: string | null;
  sender: CommentSenderDto;
  createdAt: string; // ISO
};

export type CommentsListDto = {
  comments: CommentDto[];
  offset: number;
  limit: number;
  hasMore: boolean;
};

export type CreateCommentDto = {
  rating: number;
  description?: string | null;
  recipientId: string; // uuid
};

export type UpdateCommentDto = {
  rating?: number | null;
  description?: string | null;
};