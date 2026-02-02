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
            const tenantId = localStorage.getItem('tenantId'); // Or however we store the active tenant

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            if (tenantId) {
                config.headers['x-tenant-id'] = tenantId;
            } else {
                // FALLBACK FOR DEV: Use a hardcoded tenant ID if none found (Remove in Prod)
                const DEV_TENANT_ID = 'd9b2d63d-a233-4123-8473-1952d6727289';
                console.warn(`⚠️ No Tenant ID found in localStorage. Using DEV Fallback: ${DEV_TENANT_ID}`);
                config.headers['x-tenant-id'] = DEV_TENANT_ID;
            }
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
            // console.warn('Unauthorized - Redirecting to login...');
            // window.location.href = '/login'; 
        }
        return Promise.reject(error);
    }
);

export default api;
