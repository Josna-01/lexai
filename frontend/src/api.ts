/**
 * Central API base URL helper.
 * - Local dev: Vite proxies /api → localhost:8000 (set in vite.config.ts)
 * - Production: Uses VITE_API_BASE_URL env variable (e.g., https://lexai-p9a5.onrender.com)
 */
export const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
  || (import.meta.env.DEV ? '' : 'https://lexai-p9a5.onrender.com');
