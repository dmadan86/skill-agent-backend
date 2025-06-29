export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
    status: number;
  };
  meta?: Record<string, unknown>;
}
