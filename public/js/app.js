import { api } from './api.js';
import * as ui from './ui.js';
import * as product from './modules/product.js';
import * as warranty from './modules/warranty.js';
import * as provider from './modules/provider.js';
import * as customer from './modules/customer.js';
import * as sale from './modules/sale.js';
import * as report from './modules/report.js';
import * as quote from './modules/quote.js';
import * as invoice from './modules/invoice.js';

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
                // No active session, redirect to login page
                window.location.href = 'login.html';
            }
        },

        addEventListeners() {
            // Auth
            document.getElementById('logout-btn').addEventListener('click', this.handleLogout.bind(this));

            // Notifications
            document.getElementById('notificationDropdown').addEventListener('click', this.loadRecentNotifications.bind(this));
            document.getElementById('notifications-panel').addEventListener('click', (e) => {
                if (e.target.classList.contains('mark-as-read-btn')) {
                    e.stopPropagation(); // Stop event propagation
                    const notificationId = e.target.dataset.id;
                    this.markNotificationAsRead(notificationId);
                } else if (e.target.classList.contains('notification-link')) {
                    e.stopPropagation(); // Stop event propagation
                    // Handle navigation for notification links
                    e.preventDefault();
                    const route = e.target.dataset.route;
                    if (route) {
                        this.navigate(route);
                        // Optionally mark as read when clicked
                        const notificationId = e.target.closest('li').dataset.id;
                        if (notificationId) {
                            this.markNotificationAsRead(notificationId);
                        }
                    }
                }
            });

            // Navegación
            document.querySelector('#navbarNav').addEventListener('click', (e) => {
                if (e.target.matches('a.nav-link, a.dropdown-item[data-route]')) {
                    e.preventDefault();
                    const route = e.target.dataset.route;
                    this.navigate(route);
                }
            });

            // Eventos delegados en la vista principal (para botones de tablas y formularios)
            document.getElementById('app-view').addEventListener('click', this.handleAppViewClick.bind(this));
            document.getElementById('form-modal').addEventListener('submit', this.handleModalFormSubmit.bind(this));
        },

        // --- MANEJO DE EVENTOS ---
        async handleLogout() {
            try {
                await api.logout();
                window.location.href = 'login.html';
            } catch (error) {
                ui.showAlert('Error al cerrar sesión.', 'danger');
            }
        },

        handleAppViewClick(e) {
            const activeNavLink = document.querySelector('.nav-link.active');
            if (!activeNavLink) {
                // No active navigation link found, or it doesn't have a dataset.route
                // This click is not meant for route-based delegation, so do nothing.
                return;
            }
            const route = activeNavLink.dataset.route;
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
                case 'customers':
                    customer.handleCustomerClick(e);
                    break;
                case 'sales':
                    sale.handleSaleClick(e);
                    break;
                case 'quotes':
                    quote.handleQuoteClick(e);
                    break;
                case 'reports':
                    report.handleReportClick(e);
                    break;
                case 'invoices':
                    // invoice.handleInvoiceClick(e); // No specific click handler needed for now, as actions are delegated within invoice.js
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
                case 'customers':
                    customer.handleCustomerFormSubmit(e);
                    break;
                case 'sales':
                    sale.handleSaleFormSubmit(e);
                    break;
                case 'quotes':
                    quote.handleQuoteFormSubmit(e);
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
                    warranty.init(this.user.role);
                    break;
                case 'providers':
                    provider.init(this.user.role);
                    break;
                case 'customers':
                    customer.init(this.user.role);
                    break;
                case 'sales':
                    sale.init(this.user.role);
                    break;
                case 'quotes':
                    quote.init(this.user.role);
                    break;
                case 'reports':
                    report.init();
                    break;
                case 'notifications':
                    this.showAllNotificationsPage();
                    break;
                case 'invoices':
                    invoice.init(this.user.role);
                    break;
            }
        },

        async showAllNotificationsPage(page = 1) {
            if (this.user.role !== 'admin') {
                ui.showAlert('Acceso denegado. Se requiere rol de administrador para ver todas las notificaciones.', 'danger');
                return;
            }
            try {
                const result = await api.getNotifications(page, 10); // 10 notifications per page
                ui.renderAllNotificationsPage(
                    result.data,
                    this.markNotificationAsRead.bind(this),
                    this.showAllNotificationsPage.bind(this) // Pass for pagination
                );
            } catch (error) {
                console.error('Error al cargar todas las notificaciones:', error);
                ui.showAlert('Error al cargar todas las notificaciones.', 'danger');
            }
        },

        // --- CONTROL DE VISTAS ---
        showAppView() {
            document.getElementById('app-view').style.display = 'block';
            document.getElementById('logout-btn').style.display = 'block';
            document.getElementById('user-info').textContent = `Hola, ${this.user.username} (${this.user.role})`;
            document.querySelector('.navbar').style.display = 'flex';
            this.navigate('products'); // Cargar la vista de productos por defecto
            if (this.user.role === 'admin') {
                this.updateNotificationBadge();
            }
        },

        async updateNotificationBadge() {
            try {
                const result = await api.getUnreadNotificationCount();
                const count = result.data.count;
                const badge = document.getElementById('unread-notifications-badge');
                if (badge) {
                    badge.textContent = count > 0 ? count : '';
                    badge.style.display = count > 0 ? 'block' : 'none';
                }
            } catch (error) {
                console.error('Error al actualizar el contador de notificaciones:', error);
            }
        },

        async loadRecentNotifications() {
            try {
                const result = await api.getNotifications(1, 5); // Get first 5 notifications
                ui.renderNotificationsPanel(result.data.notifications, this.markNotificationAsRead.bind(this));
            } catch (error) {
                console.error('Error al cargar notificaciones recientes:', error);
                ui.renderNotificationsPanel([]); // Render empty panel on error
            }
        },

        async markNotificationAsRead(notificationId) {
            try {
                await api.markNotificationAsRead(notificationId);
                this.updateNotificationBadge();
                this.loadRecentNotifications();
            } catch (error) {
                console.error('Error al marcar notificación como leída.', 'danger');
                ui.showAlert('Error al marcar notificación como leída.', 'danger');
            }
        }
    };

    app.init();
});