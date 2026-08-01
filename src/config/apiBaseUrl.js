const defaultApiBaseUrl = import.meta.env.DEV
  ? 'http://localhost:8080/api/v1'
  : 'https://forest.platformholder.site/api/v1';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl;
