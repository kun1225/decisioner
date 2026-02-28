// @ts-check

import { config } from '@repo/eslint-config/tanstack-internal';

export default [...config, { ignores: ['eslint.config.js'] }];
