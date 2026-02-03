import api from './api.service';

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
}

export interface TenantWithRole {
    id: string;
    name: string;
    slug: string;
    role: string;
}

export interface LoginResponse {
    accessToken: string;
    user: User;
    tenants: TenantWithRole[];
}

export interface RegisterResponse {
    accessToken: string;
    user: User;
    tenant: TenantWithRole;
}

export interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName: string;
}

export interface UserProfile extends User {
    tenants: TenantWithRole[];
}

const AUTH_TOKEN_KEY = 'accessToken';
const TENANT_ID_KEY = 'tenantId';
const TENANT_ROLE_KEY = 'tenantRole';

export const authService = {
    /**
     * Login with email and password
     */
    async login(email: string, password: string): Promise<LoginResponse> {
        const response = await api.post<LoginResponse>('/auth/login', {
            email,
            password,
        });

        const { accessToken, user, tenants } = response.data;

        // Store token
        localStorage.setItem(AUTH_TOKEN_KEY, accessToken);

        // If user has only one tenant, auto-select it
        if (tenants.length === 1) {
            localStorage.setItem(TENANT_ID_KEY, tenants[0].id);
            localStorage.setItem(TENANT_ROLE_KEY, tenants[0].role);
        }

        return response.data;
    },

    /**
     * Register a new user with their company
     */
    async register(data: RegisterData): Promise<RegisterResponse> {
        const response = await api.post<RegisterResponse>('/auth/register', data);

        const { accessToken, tenant } = response.data;

        // Store token and tenant
        localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
        localStorage.setItem(TENANT_ID_KEY, tenant.id);
        localStorage.setItem(TENANT_ROLE_KEY, tenant.role);

        return response.data;
    },

    /**
     * Get current user profile
     */
    async getProfile(): Promise<UserProfile> {
        const response = await api.get<UserProfile>('/auth/me');
        return response.data;
    },

    /**
     * Logout - clear all auth data
     */
    logout(): void {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(TENANT_ID_KEY);
        localStorage.removeItem(TENANT_ROLE_KEY);
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        if (typeof window === 'undefined') return false;
        return !!localStorage.getItem(AUTH_TOKEN_KEY);
    },

    /**
     * Get stored token
     */
    getToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(AUTH_TOKEN_KEY);
    },

    /**
     * Get current tenant ID
     */
    getCurrentTenantId(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(TENANT_ID_KEY);
    },

    /**
     * Get current tenant role
     */
    getCurrentRole(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(TENANT_ROLE_KEY);
    },

    /**
     * Select a tenant (for multi-tenant users)
     */
    selectTenant(tenant: TenantWithRole): void {
        localStorage.setItem(TENANT_ID_KEY, tenant.id);
        localStorage.setItem(TENANT_ROLE_KEY, tenant.role);
    },

    /**
     * Check if tenant is selected
     */
    hasTenantSelected(): boolean {
        if (typeof window === 'undefined') return false;
        return !!localStorage.getItem(TENANT_ID_KEY);
    },
};

export default authService;
