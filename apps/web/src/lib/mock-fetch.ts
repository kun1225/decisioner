type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

export function createFetchResponse(
  body: JsonValue,
  init: ResponseInit = {},
): Response {
  const status = init.status ?? 200
  const responseBody =
    status === 204 || status === 205 || status === 304
      ? null
      : JSON.stringify(body)

  return new Response(responseBody, {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
}

export function mockFetchJsonOnce(
  body: JsonValue,
  init: ResponseInit = {},
): void {
  const response = createFetchResponse(body, init)
  const originalFetch = globalThis.fetch
  let isUsed = false

  globalThis.fetch = ((...args: Parameters<typeof fetch>) => {
    if (!isUsed) {
      isUsed = true
      return Promise.resolve(response)
    }

    return originalFetch(...args)
  }) as typeof fetch
}
