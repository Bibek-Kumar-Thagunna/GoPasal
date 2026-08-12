import type { ApiResponse, ApiErrorBody, PaginationMeta } from "@/types";

export function success<T>(data: T): ApiResponse<T> {
    return { success: true, data, error: null };
}

export function created<T>(data: T): ApiResponse<T> {
    return { success: true, data, error: null };
}

export function paginated<T>(
    data: T[],
    meta: PaginationMeta
): ApiResponse<T[]> {
    return { success: true, data, error: null, meta };
}

export function error(
    code: string,
    message: string,
    details?: unknown
): ApiResponse<null> {
    const errorBody: ApiErrorBody = { code, message };
    if (details) errorBody.details = details;
    return { success: false, data: null, error: errorBody };
}

export function buildPaginationMeta(
    page: number,
    limit: number,
    total: number
): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
}
