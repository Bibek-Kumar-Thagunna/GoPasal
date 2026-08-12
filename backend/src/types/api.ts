export interface ApiResponse<T = unknown> {
    success: boolean;
    data: T | null;
    error: ApiErrorBody | null;
    meta?: PaginationMeta;
}

export interface ApiErrorBody {
    code: string;
    message: string;
    details?: unknown;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface PaginationQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}
