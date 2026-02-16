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
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
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
