//  @ts-check

import defaultConfig from '../../prettier.config.mjs';

/** @type {import('prettier').Config} */
const config = {
  ...defaultConfig,
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindFunctions: ['cva', 'cn', 'clsx', 'twMerge'],
};

export default config;
