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
    getProducts(page = 1, filters = {}) {
        const params = { page, ...filters };
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

    getLowStockProducts() {
        return this._fetch('/products/low-stock');
    },

    // --- Providers ---
    getProviders(page = 1, filters = {}) {
        const params = { page, ...filters };
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

    // --- Customers ---
    getCustomers(page = 1, filters = {}) {
        const params = { page, ...filters };
        const query = new URLSearchParams(params).toString();
        return this._fetch(`/customers?${query}`);
    },

    getCustomer(id) {
        return this._fetch(`/customers/${id}`);
    },

    createCustomer(customerData) {
        return this._fetch('/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customerData)
        });
    },

    updateCustomer(id, customerData) {
        return this._fetch(`/customers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customerData)
        });
    },

    deleteCustomer(id) {
        return this._fetch(`/customers/${id}`, { method: 'DELETE' });
    },

    // --- Sales ---
    getSales(page = 1, filters = {}) {
        const params = { page, ...filters };
        const query = new URLSearchParams(params).toString();
        return this._fetch(`/sales?${query}`);
    },

    getSale(id) {
        return this._fetch(`/sales/${id}`);
    },

    createSale(saleData) {
        return this._fetch('/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saleData)
        });
    },

    updateSale(id, saleData) {
        return this._fetch(`/sales/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saleData)
        });
    },

    deleteSale(id) {
        return this._fetch(`/sales/${id}`, { method: 'DELETE' });
    },

    // --- Warranties ---
    getWarranties(page = 1, filters = {}) {
        const params = { page, ...filters };
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

    updateWarranty(id, warrantyData) {
        return this._fetch(`/warranties/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(warrantyData)
        });
    },

    deleteWarranty(id) {
        return this._fetch(`/warranties/${id}`, { method: 'DELETE' });
    },

    // --- Reports ---
    getInventoryReport() {
        return this._fetch('/reports/inventory');
    },

    getSalesReport() { // Nuevo: Reporte de ventas
        return this._fetch('/reports/sales');
    },

    async generatePdfReport(type) {
        const url = `${API_BASE_URL}/reports/pdf?type=${type}`;
        try {
            const response = await fetch(url, { credentials: 'include' });

            if (!response.ok) {
                // Intenta leer el error como JSON
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `Error ${response.status}`);
            }

            return response.blob();
        } catch (error) {
            console.error('API Error (PDF):', error.message);
            throw error;
        }
    },

    getReportData(type) {
        return this._fetch(`/reports/data?type=${type}`);
    },

        // --- Quotes ---
    getQuotes(page = 1, filters = {}) {
        const params = { page, ...filters };
        const query = new URLSearchParams(params).toString();
        return this._fetch(`/quotes?${query}`);
    },

    getQuote(id) {
        return this._fetch(`/quotes/${id}`);
    },

    createQuote(quoteData) {
        return this._fetch('/quotes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(quoteData)
        });
    },

    updateQuote(id, quoteData) {
        return this._fetch(`/quotes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(quoteData)
        });
    },

    deleteQuote(id) {
        return this._fetch(`/quotes/${id}`, { method: 'DELETE' });
    },

    async generateQuotePdf(id) {
        const url = `${API_BASE_URL}/quotes/${id}/pdf`;
        try {
            const response = await fetch(url, { credentials: 'include' });

            if (!response.ok) {
                // Intenta leer el error como JSON
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `Error ${response.status}`);
            }

            return response.blob();
        } catch (error) {
            console.error('API Error (PDF):', error.message);
            throw error;
        }
    },

    // --- Notifications ---
    getNotifications(page = 1, limit = 5) {
        return this._fetch(`/notifications?page=${page}&limit=${limit}`);
    },

    getUnreadNotificationCount() {
        return this._fetch('/notifications/unread-count');
    },

    markNotificationAsRead(id) {
        return this._fetch(`/notifications/${id}/mark-read`, {
            method: 'POST'
        });
    },

    // --- Invoices ---
    getInvoices(page = 1, filters = {}) {
        const params = { page, ...filters };
        const query = new URLSearchParams(params).toString();
        return this._fetch(`/invoices?${query}`);
    },

    generateInvoice(saleId) {
        return this._fetch(`/invoices/generate/${saleId}`, {
            method: 'POST',
        });
    },

    getInvoice(id) {
        return this._fetch(`/invoices/${id}`);
    },

    updateInvoice(id, data) {
        return this._fetch(`/invoices/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },

    deleteInvoice(id) {
        return this._fetch(`/invoices/${id}`, {
            method: 'DELETE'
        });
    },

    previewInvoice(id) {
        window.open(`${API_BASE_URL}/invoices/${id}/preview`, '_blank');
    }
};