type LogoutActionInput = {
  logoutRequest: () => Promise<void>
  clearAccessToken: () => void
  setGuest: () => void
}

export async function performLogout(input: LogoutActionInput): Promise<void> {
  try {
    await input.logoutRequest()
  } catch {
    // Reaching guest state is more important than remote revoke availability.
  } finally {
    input.clearAccessToken()
    input.setGuest()
  }
}
