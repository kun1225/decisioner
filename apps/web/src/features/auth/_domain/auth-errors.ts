const DEFAULT_NETWORK_MESSAGE = 'Network request failed'

type AuthApiErrorOptions = {
  status: number
  code: string
  message: string
}

export class AuthApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(options: AuthApiErrorOptions) {
    super(options.message)
    this.name = 'AuthApiError'
    this.status = options.status
    this.code = options.code
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function mapAuthApiError(error: unknown): AuthApiError {
  if (!isRecord(error)) {
    return new AuthApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: DEFAULT_NETWORK_MESSAGE,
    })
  }

  const status =
    typeof error.status === 'number' && Number.isFinite(error.status)
      ? error.status
      : 0
  const code = typeof error.code === 'string' ? error.code : 'UNKNOWN_ERROR'
  const message =
    typeof error.message === 'string' ? error.message : DEFAULT_NETWORK_MESSAGE

  return new AuthApiError({ status, code, message })
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof AuthApiError && error.status === 401
}
