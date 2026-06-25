const API_CONFIG = {
  api_url: 'v1.api',
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
