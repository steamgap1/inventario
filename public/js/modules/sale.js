
import { api } from '../api.js';
import * as ui from '../ui.js';

let sales = [];
let products = [];
let userRole = '';

async function loadSales(filters = {}) {
    try {
        const result = await api.getSales(filters);
        sales = result.data;
        ui.renderSales(sales, userRole);
        setupSaleFilters();
    } catch (error) {
        ui.showAlert('Error al cargar ventas: ' + error.message, 'danger');
    }
}

function setupSaleFilters() {
    const form = document.getElementById('sale-filter-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const search = form.elements['search-sale'].value;
            const filters = { search };
            loadSales(filters);
        });

        document.getElementById('clear-sale-filters').addEventListener('click', () => {
            form.reset();
            loadSales({}); // Load all sales
        });
    }
}

async function showAddSaleForm() {
    if (products.length === 0) {
        await loadProducts();
    }
    ui.showSaleForm(products);
}

async function saveSale(form) {
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
        loadSales();
        // We need to reload products to see the updated stock
        // This is a temporary solution, a better approach would be to update the product in the state
        const productModule = await import('./product.js');
        productModule.init(userRole);
    } catch (error) {
        ui.showAlert('Error al registrar la venta: ' + error.message, 'danger');
    }
}

async function loadProducts() {
    try {
        const result = await api.getProducts();
        products = result.data;
    } catch (error) {
        ui.showAlert('Error al cargar productos: ' + error.message, 'danger');
    }
}

export function init(role) {
    userRole = role;
    loadSales();
}

export function handleSaleClick(e) {
    if (e.target.id === 'add-sale-btn') {
        showAddSaleForm();
    }
}

export function handleSaleFormSubmit(e) {
    if (e.target.id === 'sale-form') {
        saveSale(e.target);
    }
}
