const API_CONFIG = {
  api_url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
} as const;

for (const configKey in API_CONFIG) {
  if (!API_CONFIG[configKey as keyof typeof API_CONFIG]) {
    throw Error('api config not found');
  }
}

const NODE_ENV = process.env.NODE_ENV;

const CONFIG = {
  apiConfig: API_CONFIG,
  alert: {
    maxDisplayNumber: 4,
    clearDelayMillisecond: 5000,
  },
} as const;

let config;

switch (NODE_ENV) {
  case 'development':
    config = CONFIG;
    break;
  default:
    config = CONFIG;
}

export default config as typeof CONFIG;
