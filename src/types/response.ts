export type ResponseSenderDto = {
  id: string; // uuid
  name: string;
};

export type ResponseDto = {
  id: string; // uuid
  sender: ResponseSenderDto;
  taskId: string; // uuid
  taskTitle: string;
  status: string; // "На рассмотрении" и т.п.
};

export type ResponsesListDto = {
  responses: ResponseDto[];
  offset: number;
  limit: number;
  hasMore: boolean;
};