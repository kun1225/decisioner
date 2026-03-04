import { useEffect, useRef } from 'react';

import { me, refresh } from './auth-client';
import type { AuthSessionActions } from './auth-session-provider';

type RestoreActions = Pick<
  AuthSessionActions,
  'setAuthenticated' | 'setAnonymous'
>;

export function useSessionRestore(actions: RestoreActions) {
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    refresh()
      .then(({ accessToken }) =>
        me(accessToken).then((user) => ({ accessToken, user })),
      )
      .then(({ accessToken, user }) => {
        actions.setAuthenticated({ accessToken, user });
      })
      .catch(() => {
        actions.setAnonymous();
      });
  }, [actions]);
}
