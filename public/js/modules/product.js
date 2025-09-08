import { api } from '../api.js';
import * as ui from '../ui.js';

let products = [];
let providers = [];
let userRole = '';
let currentFilters = {};

// Template caching
const productRowTemplate = document.getElementById('product-row-template').content;

function getProductRow(product, userRole) {
    const row = document.importNode(productRowTemplate, true);
    const rowElement = row.querySelector('tr');
    rowElement.dataset.id = product.id;

    row.querySelector('[data-label="ID"]').textContent = product.id;
    row.querySelector('[data-label="Nombre"]').textContent = product.name;
    row.querySelector('[data-label="Condición"]').textContent = product.condition;
    row.querySelector('[data-label="Stock"]').textContent = product.stock;
    row.querySelector('[data-label="Proveedor"]').textContent = product.provider_name || 'Anónimo';
    row.querySelector('[data-label="F. Entrada"]').textContent = product.entry_date || 'N/A';
    row.querySelector('[data-label="Garantía Exp."]').textContent = product.warranty_expires_on || 'N/A';

    if (userRole === 'admin') {
        row.querySelector('[data-label="Costo"]').textContent = `$${parseFloat(product.cost).toFixed(2)}`;
        row.querySelector('[data-label="P. Cliente"]').textContent = `$${parseFloat(product.price_client).toFixed(2)}`;
        row.querySelector('[data-label="P. Mayorista"]').textContent = `$${parseFloat(product.price_wholesale).toFixed(2)}`;
        row.querySelector('[data-label="P. Técnico"]').textContent = `$${parseFloat(product.price_technician).toFixed(2)}`;
        row.querySelector('.edit-product-btn').dataset.id = product.id;
        row.querySelector('.delete-product-btn').dataset.id = product.id;
        row.querySelectorAll('.non-admin-only').forEach(el => el.remove());
    } else {
        row.querySelector('[data-label="Precio"]').textContent = `$${parseFloat(product.price_client).toFixed(2)}`;
        row.querySelectorAll('.admin-only').forEach(el => el.remove());
    }

    return row;
}

async function loadProducts(page = 1, filters = {}) {
    currentFilters = filters;
    try {
        const result = await api.getProducts(page, filters);
        products = result.data;
        ui.renderProducts(products, result.pagination, userRole, getProductRow, (newPage) => loadProducts(newPage, currentFilters));
        setupProductFilters();
    } catch (error) {
        ui.showAlert('Error al cargar productos: ' + error.message, 'danger');
    }
}

function setupProductFilters() {
    const form = document.getElementById('product-filter-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const search = form.elements['search-product'].value;
            const stockOrder = form.elements['stock-order'].value;
            const priceOrder = form.elements['price-order'].value;
            const lowStock = form.elements['low-stock-filter'].checked;

            const filters = {
                search: search,
                stock_order: stockOrder,
                price_order: priceOrder,
                low_stock: lowStock ? 'true' : 'false'
            };
            loadProducts(1, filters);
        });

        document.getElementById('clear-product-filters').addEventListener('click', () => {
            form.reset();
            loadProducts(1, {});
        });
    }
}

async function showAddProductForm() {
    if (providers.length === 0) {
        const result = await api.getProviders();
        providers = result.data;
    }
    ui.showProductForm({}, providers);
}

async function showEditProductForm(productId) {
    const product = products.find(p => p.id == productId);
    if (providers.length === 0) {
        const result = await api.getProviders();
        providers = result.data;
    }
    ui.showProductForm(product, providers);
}

async function saveProduct(form) {
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
        loadProducts();
    } catch (error) {
        ui.showAlert('Error al guardar el producto: ' + error.message, 'danger');
    }
}

function deleteProduct(id, button) {
    button.disabled = true;
    ui.showConfirmModal(
        'Confirmar Eliminación',
        '¿Estás seguro de que quieres eliminar este producto?',
        async () => {
            try {
                await api.deleteProduct(id);
                ui.showAlert('Producto eliminado con éxito.');
                loadProducts();
            } catch (error) {
                ui.showAlert('Error al eliminar el producto: ' + error.message, 'danger');
                button.disabled = false;
            }
        }
    );

    const modalElement = document.getElementById('form-modal');
    modalElement.addEventListener('hidden.bs.modal', () => {
        button.disabled = false;
    }, { once: true });
}

export function init(role) {
    userRole = role;
    loadProducts();
}

export function handleProductClick(e) {
    if (e.target.id === 'add-product-btn') {
        showAddProductForm();
    } else if (e.target.classList.contains('edit-product-btn')) {
        const id = e.target.dataset.id;
        showEditProductForm(id);
    } else if (e.target.classList.contains('delete-product-btn')) {
        const id = e.target.dataset.id;
        deleteProduct(id, e.target);
    }
}

export function handleProductFormSubmit(e) {
    if (e.target.id === 'product-form') {
        saveProduct(e.target);
    }
}