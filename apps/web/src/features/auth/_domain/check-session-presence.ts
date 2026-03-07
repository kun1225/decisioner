import { createServerFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';

export const checkSessionPresence = createServerFn({ method: 'GET' }).handler(
  () => !!getCookie('session_presence'),
);
