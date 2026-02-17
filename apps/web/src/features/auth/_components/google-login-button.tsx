import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field';

import { mapAuthApiError } from '../_domain/auth-errors';
import { googleLogin, isGoogleLoginEnabled } from '../_domain/google-login';
import { setAccessToken } from '../_domain/token-storage';

type GoogleLoginButtonProps = {
  enabled?: boolean;
  getIdToken?: () => Promise<string>;
  onSuccess?: (accessToken: string) => Promise<void> | void;
};

export function GoogleLoginButton({
  enabled,
  getIdToken,
  onSuccess,
}: GoogleLoginButtonProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEnabled = enabled ?? isGoogleLoginEnabled();
  if (!isEnabled) {
    return null;
  }

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={isSubmitting}
        onClick={async () => {
          if (!getIdToken) {
            setErrorMessage('Google login is not configured');
            return;
          }

          setIsSubmitting(true);
          setErrorMessage(null);
          try {
            const idToken = await getIdToken();
            const result = await googleLogin(idToken);
            setAccessToken(result.accessToken);
            await onSuccess?.(result.accessToken);
          } catch (error) {
            setErrorMessage(mapAuthApiError(error).message);
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        {isSubmitting ? 'Connecting...' : 'Continue with Google'}
      </Button>
      <FieldError>{errorMessage}</FieldError>
    </div>
  );
}
