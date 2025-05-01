export interface ApiError extends Error {
  statusCode?: number;
  details?: string;
  debug?: any;
}