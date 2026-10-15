import { io } from 'socket.io-client';
import { getToken } from './api';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/v1\/?$/, '') ||
  'http://localhost:5000';

export function connectSocket() {
  const token = getToken();
  if (!token) return null;
  return io(SOCKET_URL, { auth: { token }, withCredentials: true });
}
