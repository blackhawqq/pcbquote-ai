export type { User, Quote, Subscription, ApiKey, AuditLog } from "@prisma/client";
export * from "./pcb";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardStats {
  totalQuotes: number;
  quotesThisMonth: number;
  averageQuoteValue: number;
  totalRevenue: number;
  planLimitReached: boolean;
  quotesRemaining: number | null;
}
