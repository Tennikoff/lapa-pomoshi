export type ResponseSenderDto = {
  id: string;
  name: string;
};

export type ResponseDto = {
  id: string;
  sender: ResponseSenderDto;
  taskId: string;
  taskTitle: string;
  status: string;
};

export type ResponsesListDto = {
  responses: ResponseDto[];
  offset: number;
  limit: number;
  hasMore: boolean;
};