import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Default to localhost:4000 if not specified, matching the typical backend port
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Add Auth Token and Tenant ID
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Only run on client-side
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
            const tenantId = localStorage.getItem('tenantId');

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            if (tenantId) {
                config.headers['x-tenant-id'] = tenantId;
            }
            // No fallback - if no tenant, the backend will return appropriate error
            // This ensures new users don't see other tenant's data
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle 401s (Optional: redirect to login)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid — clear auth state and redirect
            if (typeof window !== 'undefined') {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('tenant_id');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
