
const API_BASE_URL = '/inventario/public'; // Ajusta si tu estructura de URL es diferente

export const api = {
    async _fetch(url, options = {}) {
        options.headers = options.headers || {};
        options.credentials = 'include'; // Incluir cookies en las solicitudes para la sesión

        try {
            const response = await fetch(API_BASE_URL + url, options);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Error ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Error:', error.message);
            throw error;
        }
    },

    // --- Auth ---
    login(username, password) {
        return this._fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
    },

    logout() {
        return this._fetch('/logout', { method: 'POST' });
    },

    checkSession() {
        return this._fetch('/session');
    },

    // --- Products ---
    getProducts(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this._fetch(`/products?${query}`);
    },

    getProduct(id) {
        return this._fetch(`/products/${id}`);
    },

    createProduct(productData) {
        return this._fetch('/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
    },

    updateProduct(id, productData) {
        return this._fetch(`/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
    },

    deleteProduct(id) {
        return this._fetch(`/products/${id}`, { method: 'DELETE' });
    },

    uploadProductImage(id, formData) {
        return this._fetch(`/products/${id}/upload`, {
            method: 'POST',
            body: formData
        });
    },

    // --- Providers ---
    getProviders(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this._fetch(`/providers?${query}`);
    },

    createProvider(providerData) {
        return this._fetch('/providers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(providerData)
        });
    },

    updateProvider(id, providerData) {
        return this._fetch(`/providers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(providerData)
        });
    },

    deleteProvider(id) {
        return this._fetch(`/providers/${id}`, { method: 'DELETE' });
    },

    // --- Sales ---
    getSales(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this._fetch(`/sales?${query}`);
    },

    createSale(saleData) {
        return this._fetch('/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saleData)
        });
    },

    // --- Warranties ---
    getWarranties(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this._fetch(`/warranties?${query}`);
    },

    createWarranty(warrantyData) {
        return this._fetch('/warranties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(warrantyData)
        });
    },

    updateWarrantyStatus(id, status) {
        return this._fetch(`/warranties/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
    },

    // --- Reports ---
    getInventoryReport() {
        return this._fetch('/reports/inventory');
    },

    getSalesReport() { // Nuevo: Reporte de ventas
        return this._fetch('/reports/sales');
    }
};