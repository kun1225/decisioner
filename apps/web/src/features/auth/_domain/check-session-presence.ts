import { createServerFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';

export const checkSessionPresence = createServerFn({ method: 'GET' }).handler(
  async () => !!getCookie('session_presence'),
);
