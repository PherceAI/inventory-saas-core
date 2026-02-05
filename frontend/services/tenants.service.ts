import api from './api.service';

export interface CompanyProfile {
    legalName?: string;
    taxId?: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
    brandColor?: string;
}

export interface LocalizationSettings {
    currency?: string;
    timezone?: string;
}

export interface TenantSettings {
    profile?: CompanyProfile;
    localization?: LocalizationSettings;
}

export const tenantsService = {
    // Other existing methods...

    /**
     * Update tenant settings (Profile & Localization)
     */
    updateSettings: async (tenantId: string, data: TenantSettings) => {
        const response = await api.patch(`/tenants/${tenantId}/settings`, data);
        return response.data;
    },

    /**
     * Get tenant details (reusing existing endpoint potentially or new one if needed)
     * Assuming getMyTenants gives basic info, but we need settings. 
     * We might need to fetch full tenant details.
     */
    getTenantDetails: async (tenantId: string) => {
        // We actually need an endpoint to GET /tenants/:id to load current settings
        // But for now, let's assume getMyTenants or similar provides it, 
        // OR we just assume we only update adjustments. 
        // Ideally we need to read current state.
        // Let's check update endpoint response, it returns settings.
        // We can fetch user profile which has tenants, but maybe not deep settings.
        // Let's try to use authService.getProfile() to refresh if needed, but likely we need a GET.
        // TODO: Ensure backend has GET /tenants/:id/settings or similar.
    }
};
