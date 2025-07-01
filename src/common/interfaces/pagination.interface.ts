export interface PaginationResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
} 