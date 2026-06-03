/** Shared API envelope types (mirrors the backend response helpers). */
export interface ApiSuccess<T> {
  status: 'success';
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  status: 'error';
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
