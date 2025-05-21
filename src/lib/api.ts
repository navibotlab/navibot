import axios from 'axios';

/**
 * Cliente HTTP centralizado para chamadas de API
 * Com interceptores para adicionar tratamento de erros e autenticação global
 */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token de autenticação (se necessário)
api.interceptors.request.use(
  (config) => {
    // Adiciona o token se existir no localStorage (apenas no cliente)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de resposta para tratamento de erros
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Tratamento centralizado de erros
    if (error.response) {
      // Erros do servidor (status code não 2xx)
      console.error('Erro de resposta:', error.response.status, error.response.data);
      
      // Tratamento de erro 401 (não autorizado)
      if (error.response.status === 401) {
        // Se estiver no cliente, redireciona para o login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          // window.location.href = '/login';
        }
      }
    } else if (error.request) {
      // Requisição foi feita mas não houve resposta
      console.error('Erro de requisição:', error.request);
    } else {
      // Algo aconteceu durante a configuração da requisição
      console.error('Erro:', error.message);
    }
    
    return Promise.reject(error);
  }
); 