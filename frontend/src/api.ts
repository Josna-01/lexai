/**
 * Central API base URL helper.
 * - Local dev: Vite proxies /api → localhost:8000 (set in vite.config.ts)
 * - Production (Vercel): Set VITE_API_BASE_URL to your Render backend URL
 *   e.g. https://lexai-backend.onrender.com
 */
export const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';
