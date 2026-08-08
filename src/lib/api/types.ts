export type ApiErrorBody = {
  success: false
  error: {
    code: string
    message: string
    requestId?: string
    details?: Record<string, string[]>
  }
}

export type ApiSuccessBody<T> = {
  success: true
  data: T
  meta?: Record<string, unknown>
}

export type ApiBody<T> = ApiSuccessBody<T> | ApiErrorBody

export function isApiSuccess<T>(body: ApiBody<T>): body is ApiSuccessBody<T> {
  return body.success === true
}
