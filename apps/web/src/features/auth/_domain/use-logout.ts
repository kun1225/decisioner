import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { logout } from './auth-client';
import { useAuthSessionActions } from './auth-session-provider';

export function useLogout() {
  const navigate = useNavigate();
  const { setAnonymous } = useAuthSessionActions();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logout();
    } catch {
      // best-effort: server revocation may fail
    }

    setAnonymous();
    await navigate({ to: '/' });
    setIsLoggingOut(false);
  };

  return { handleLogout, isLoggingOut };
}
