/**
 * Central API base URL. Reads VITE_API_URL at build time and falls back to the
 * local Symfony dev server. Importing this constant avoids the hard-coded
 * `http://localhost:8000` literal that used to be scattered across components.
 */
export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';

/**
 * Central WebSocket URL for the Workerman chat server.
 */
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8081';

export default API_URL;
