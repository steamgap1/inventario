// public/js/app.js

document.addEventListener('DOMContentLoaded', () => {
    const app = {
        user: null,
        products: [],
        warranties: [],
        providers: [],
        sales: [], // Nuevo: para almacenar ventas

        init() {
            this.addEventListeners();
        },

        addEventListeners() {
            // Auth
            document.getElementById('login-form').addEventListener('submit', this.handleLogin.bind(this));
            document.getElementById('logout-btn').addEventListener('click', this.handleLogout.bind(this));

            // Navegación
            document.querySelector('#navbarNav').addEventListener('click', (e) => {
                if (e.target.matches('a.nav-link')) {
                    e.preventDefault();
                    const route = e.target.dataset.route;
                    this.navigate(route);
                }
            });

            // Eventos delegados en la vista principal (para botones de tablas y formularios)
            ui.appView.addEventListener('click', this.handleAppViewClick.bind(this));
            document.getElementById('form-modal').addEventListener('submit', this.handleModalFormSubmit.bind(this));
        },

        // --- MANEJO DE EVENTOS ---
        async handleLogin(e) {
            e.preventDefault();
            const username = e.target.elements.username.value;
            const password = e.target.elements.password.value;

            try {
                const result = await api.login(username, password);
                this.user = result.data;
                this.showAppView();
            } catch (error) {
                ui.showAlert('Error: ' + error.message, 'danger');
            }
        },

        async handleLogout() {
            try {
                await api.logout();
                this.user = null;
                this.showLoginView();
            } catch (error) {
                ui.showAlert('Error al cerrar sesión.', 'danger');
            }
        },

        handleAppViewClick(e) {
            if (e.target.id === 'add-product-btn') {
                this.showAddProductForm();
            } else if (e.target.classList.contains('edit-product-btn')) {
                const id = e.target.dataset.id;
                const product = this.products.find(p => p.id == id);
                this.showEditProductForm(product);
            } else if (e.target.classList.contains('delete-product-btn')) {
                const id = e.target.dataset.id;
                this.deleteProduct(id);
            } else if (e.target.id === 'add-warranty-btn') {
                this.showAddWarrantyForm();
            } else if (e.target.id === 'add-provider-btn') {
                ui.showProviderForm();
            } else if (e.target.classList.contains('edit-provider-btn')) {
                const id = e.target.dataset.id;
                const provider = this.providers.find(p => p.id == id);
                ui.showProviderForm(provider);
            } else if (e.target.classList.contains('delete-provider-btn')) {
                const id = e.target.dataset.id;
                this.deleteProvider(id);
            } else if (e.target.id === 'add-sale-btn') { // Nuevo: Añadir venta
                this.showAddSaleForm();
            }
        },

        handleModalFormSubmit(e) {
            e.preventDefault();
            const form = e.target;

            if (form.id === 'product-form') {
                this.saveProduct(form);
            } else if (form.id === 'warranty-form') {
                this.saveWarranty(form);
            } else if (form.id === 'provider-form') {
                this.saveProvider(form);
            } else if (form.id === 'sale-form') { // Nuevo: Guardar venta
                this.saveSale(form);
            }
        },

        // --- LÓGICA DE NAVEGACIÓN Y DATOS ---
        navigate(route) {
            console.log(`Navegando a: ${route}`);
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.querySelector(`[data-route="${route}"]`).classList.add('active');

            switch (route) {
                case 'products':
                    this.loadProducts();
                    break;
                case 'warranties':
                    this.loadWarranties();
                    break;
                case 'providers':
                    this.loadProviders();
                    break;
                case 'sales': // Nuevo: Cargar ventas
                    this.loadSales();
                    break;
                case 'reports':
                    this.loadReports();
                    break;
            }
        },

        async loadProducts() {
            try {
                const result = await api.getProducts();
                this.products = result.data;
                ui.renderProducts(this.products, this.user.role);
            } catch (error) {
                ui.showAlert('Error al cargar productos: ' + error.message, 'danger');
            }
        },

        async loadWarranties() {
            try {
                const result = await api.getWarranties();
                this.warranties = result.data;
                // Necesitamos los productos para el formulario de añadir garantía
                if (this.products.length === 0) {
                    const prodResult = await api.getProducts();
                    this.products = prodResult.data;
                }
                ui.renderWarranties(this.warranties);
            } catch (error) {
                ui.showAlert('Error al cargar garantías: ' + error.message, 'danger');
            }
        },

        async loadProviders() {
            try {
                const result = await api.getProviders();
                this.providers = result.data;
                ui.renderProviders(this.providers, this.user.role);
            } catch (error) {
                ui.showAlert('Error al cargar proveedores: ' + error.message, 'danger');
            }
        },

        async loadSales() { // Nuevo: Cargar ventas
            try {
                const result = await api.getSales();
                this.sales = result.data;
                ui.renderSales(this.sales, this.user.role);
            } catch (error) {
                ui.showAlert('Error al cargar ventas: ' + error.message, 'danger');
            }
        },

        async loadReports() {
            try {
                const result = await api.getInventoryReport();
                ui.renderReports(result.data);
            } catch (error) {
                ui.showAlert('Error al cargar el reporte: ' + error.message, 'danger');
            }
        },

        // --- LÓGICA DE ACCIONES CRUD ---
        async showAddProductForm() {
            // Asegurarse de que los proveedores estén cargados antes de mostrar el formulario
            if (this.providers.length === 0) {
                await this.loadProviders();
            }
            ui.showProductForm({}, this.providers);
        },

        async showEditProductForm(product) {
            if (this.providers.length === 0) {
                await this.loadProviders();
            }
            ui.showProductForm(product, this.providers);
        },

        async saveProduct(form) {
            const id = form.dataset.id;
            const productData = {
                name: form.elements.name.value,
                description: form.elements.description.value,
                stock: form.elements.stock.value,
                condition: form.elements.condition.value,
                cost: form.elements.cost.value,
                price_client: form.elements.price_client.value,
                price_wholesale: form.elements.price_wholesale.value,
                price_technician: form.elements.price_technician.value,
                provider_id: form.elements.provider_id.value || null,
                entry_date: form.elements.entry_date.value || null,
                warranty_expires_on: form.elements.warranty_expires_on.value || null
            };

            try {
                if (id) {
                    await api.updateProduct(id, productData);
                    ui.showAlert('Producto actualizado con éxito.');
                } else {
                    await api.createProduct(productData);
                    ui.showAlert('Producto creado con éxito.');
                }
                ui.hideModal();
                this.loadProducts();
            } catch (error) {
                ui.showAlert('Error al guardar el producto: ' + error.message, 'danger');
            }
        },

        async deleteProduct(id) {
            if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
                try {
                    await api.deleteProduct(id);
                    ui.showAlert('Producto eliminado con éxito.');
                    this.loadProducts();
                } catch (error) {
                    ui.showAlert('Error al eliminar el producto: ' + error.message, 'danger');
                }
            }
        },

        async showAddWarrantyForm() {
            if (this.products.length === 0) {
                await this.loadProducts();
            }
            ui.showWarrantyForm(this.products);
        },

        async saveWarranty(form) {
            const warrantyData = {
                product_id: form.elements.product_id.value,
                start_date: form.elements.start_date.value,
                end_date: form.elements.end_date.value,
                notes: form.elements.notes.value
            };

            try {
                await api.createWarranty(warrantyData);
                ui.showAlert('Garantía registrada con éxito.');
                ui.hideModal();
                this.loadWarranties();
            } catch (error) {
                ui.showAlert('Error al registrar la garantía: ' + error.message, 'danger');
            }
        },

        async saveProvider(form) {
            const id = form.dataset.id;
            const providerData = {
                name: form.elements.name.value,
                contact_person: form.elements.contact_person.value,
                phone: form.elements.phone.value,
                email: form.elements.email.value
            };

            try {
                if (id) {
                    await api.updateProvider(id, providerData);
                    ui.showAlert('Proveedor actualizado con éxito.');
                } else {
                    await api.createProvider(providerData);
                    ui.showAlert('Proveedor creado con éxito.');
                }
                ui.hideModal();
                this.loadProviders();
            } catch (error) {
                ui.showAlert('Error al guardar el proveedor: ' + error.message, 'danger');
            }
        },

        async deleteProvider(id) {
            if (confirm('¿Estás seguro de que quieres eliminar este proveedor? Esto no eliminará los productos asociados.')) {
                try {
                    await api.deleteProvider(id);
                    ui.showAlert('Proveedor eliminado con éxito.');
                    this.loadProviders();
                } catch (error) {
                    ui.showAlert('Error al eliminar el proveedor: ' + error.message, 'danger');
                }
            }
        },

        async showAddSaleForm() { // Nuevo: Mostrar formulario de venta
            if (this.products.length === 0) {
                await this.loadProducts();
            }
            ui.showSaleForm(this.products);
        },

        async saveSale(form) { // Nuevo: Guardar venta
            const saleData = {
                product_id: form.elements.product_id.value,
                quantity: form.elements.quantity.value,
                sale_price: form.elements.sale_price.value,
                customer_name: form.elements.customer_name.value || null,
                notes: form.elements.notes.value || null
            };

            try {
                await api.createSale(saleData);
                ui.showAlert('Venta registrada con éxito y stock actualizado.');
                ui.hideModal();
                this.loadSales();
                this.loadProducts(); // Recargar productos para ver el stock actualizado
            } catch (error) {
                ui.showAlert('Error al registrar la venta: ' + error.message, 'danger');
            }
        },

        // --- CONTROL DE VISTAS ---
        showAppView() {
            document.getElementById('login-view').style.display = 'none';
            document.getElementById('app-view').style.display = 'block';
            document.getElementById('logout-btn').style.display = 'block';
            document.getElementById('user-info').textContent = `Hola, ${this.user.username} (${this.user.role})`;
            document.querySelector('.navbar').style.display = 'flex';
            this.navigate('products'); // Cargar la vista de productos por defecto
        },

        showLoginView() {
            document.getElementById('login-view').style.display = 'block';
            document.getElementById('app-view').style.display = 'none';
            document.getElementById('logout-btn').style.display = 'none';
            document.getElementById('user-info').textContent = '';
            document.querySelector('.navbar').style.display = 'none'; // Ocultar nav en login
        }
    };

    app.init();
});
