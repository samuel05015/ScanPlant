const getApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '');

  if (import.meta.env.PROD) {
    if (!configuredUrl) {
      throw new Error('VITE_API_URL não foi configurada para o ambiente de produção.');
    }

    return configuredUrl.endsWith('/api') ? configuredUrl : `${configuredUrl}/api`;
  }

  return 'http://localhost:5041/api';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 10000,
};
