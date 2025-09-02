
import { api } from './api.js';
import * as ui from './ui.js';
import * as product from './modules/product.js';
import * as warranty from './modules/warranty.js';
import * as provider from './modules/provider.js';
import * as sale from './modules/sale.js';
import * as report from './modules/report.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log(ui);
    const app = {
        user: null,

        async init() {
            this.addEventListeners();
            try {
                const result = await api.checkSession();
                this.user = result.data;
                this.showAppView();
            } catch (error) {
                // No active session, show login view
                this.showLoginView();
            }
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
            const route = document.querySelector('.nav-link.active').dataset.route;
            switch (route) {
                case 'products':
                    product.handleProductClick(e);
                    break;
                case 'warranties':
                    warranty.handleWarrantyClick(e);
                    break;
                case 'providers':
                    provider.handleProviderClick(e);
                    break;
                case 'sales':
                    sale.handleSaleClick(e);
                    break;
                case 'reports':
                    report.handleReportClick(e);
                    break;
            }
        },

        handleModalFormSubmit(e) {
            e.preventDefault();
            const route = document.querySelector('.nav-link.active').dataset.route;
            switch (route) {
                case 'products':
                    product.handleProductFormSubmit(e);
                    break;
                case 'warranties':
                    warranty.handleWarrantyFormSubmit(e);
                    break;
                case 'providers':
                    provider.handleProviderFormSubmit(e);
                    break;
                case 'sales':
                    sale.handleSaleFormSubmit(e);
                    break;
            }
        },

        // --- LÓGICA DE NAVEGACIÓN Y DATOS ---
        navigate(route) {
            console.log(`Navegando a: ${route}`);
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.querySelector(`[data-route="${route}"]`).classList.add('active');

            switch (route) {
                case 'products':
                    product.init(this.user.role);
                    break;
                case 'warranties':
                    warranty.init();
                    break;
                case 'providers':
                    provider.init(this.user.role);
                    break;
                case 'sales':
                    sale.init(this.user.role);
                    break;
                case 'reports':
                    report.init();
                    break;
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
