import { io } from 'socket.io-client';

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
// Extrai apenas a origin (http://localhost:3002) da URL da API
const SOCKET_URL = VITE_API_URL.replace('/api', '');

export const socket = io(SOCKET_URL, {
  autoConnect: false, // Só conecta quando o usuário logar / entrar na rota
  withCredentials: true,
});

export default socket;
