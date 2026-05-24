export type CommentSenderDto = {
  id: string;
  name: string;
};

export type CommentDto = {
  id: string;
  rating: number;
  description: string | null;
  sender: CommentSenderDto;
  createdAt: string;
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
  recipientId: string;
};

export type UpdateCommentDto = {
  rating?: number | null;
  description?: string | null;
};