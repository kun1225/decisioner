import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { logout } from '../_domain/auth-api';
import { useAuthSession } from '../_domain/auth-session-store';
import { performLogout } from '../_domain/logout-action';
import { clearAccessToken } from '../_domain/token-storage';

export function LogoutButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    state: { status },
    setGuest,
  } = useAuthSession();

  if (status !== 'authenticated') {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isSubmitting}
      onClick={async () => {
        setIsSubmitting(true);
        await performLogout({
          logoutRequest: logout,
          clearAccessToken,
          setGuest,
        });
        setIsSubmitting(false);
      }}
    >
      {isSubmitting ? 'Signing Out...' : 'Sign Out'}
    </Button>
  );
}
