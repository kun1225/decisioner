import { useState } from 'react'

import { logout } from '../_domain/auth-api'
import { useAuthSession } from '../_domain/auth-session-store'
import { performLogout } from '../_domain/logout-action'
import { clearAccessToken } from '../_domain/token-storage'

export function LogoutButton() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    state: { status },
    setGuest,
  } = useAuthSession()

  if (status !== 'authenticated') {
    return null
  }

  return (
    <button
      type="button"
      className="rounded-md border border-white/30 px-3 py-2 text-sm hover:bg-white/10"
      disabled={isSubmitting}
      onClick={async () => {
        setIsSubmitting(true)
        await performLogout({
          logoutRequest: logout,
          clearAccessToken,
          setGuest,
        })
        setIsSubmitting(false)
      }}
    >
      {isSubmitting ? 'Signing Out...' : 'Sign Out'}
    </button>
  )
}
