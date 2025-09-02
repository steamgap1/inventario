import { api } from '../api.js';
import * as ui from '../ui.js';

let products = [];
let providers = [];
let userRole = '';

function getProductRow(product, userRole) {
    const actions = (userRole === 'admin') ? `
        <td>
            <button class="btn btn-sm btn-warning edit-product-btn" data-id="${product.id}">Editar</button>
            <button class="btn btn-sm btn-danger delete-product-btn" data-id="${product.id}">Eliminar</button>
        </td>
    ` : '';
    
    let priceDisplay = '';
    if (userRole === 'admin') {
        priceDisplay = `
            <td>$${parseFloat(product.cost).toFixed(2)}</td>
            <td>$${parseFloat(product.price_client).toFixed(2)}</td>
            <td>$${parseFloat(product.price_wholesale).toFixed(2)}</td>
            <td>$${parseFloat(product.price_technician).toFixed(2)}</td>
        `;
    } else {
        priceDisplay = `<td>$${parseFloat(product.price).toFixed(2)}</td>`;
    }

    return `
        <tr data-id="${product.id}">
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.condition}</td>
            <td>${product.stock}</td>
            ${priceDisplay}
            <td>${product.provider_name || 'Anónimo'}</td>
            <td>${product.entry_date || 'N/A'}</td>
            <td>${product.warranty_expires_on || 'N/A'}</td>
            ${actions}
        </tr>
    `;
}

async function loadProducts(filters = {}) {
    try {
        const result = await api.getProducts(filters);
        products = result.data;
        ui.renderProducts(products, userRole, getProductRow);
        setupProductFilters(); // Call setup after rendering
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
            loadProducts(filters);
        });

        document.getElementById('clear-product-filters').addEventListener('click', () => {
            form.reset();
            loadProducts({}); // Load all products
        });
    }
}

async function showAddProductForm() {
    // Asegurarse de que los proveedores estén cargados antes de mostrar el formulario
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

async function deleteProduct(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
        try {
            await api.deleteProduct(id);
            ui.showAlert('Producto eliminado con éxito.');
            loadProducts();
        } catch (error) {
            ui.showAlert('Error al eliminar el producto: ' + error.message, 'danger');
        }
    }
}

export function init(role) {
    userRole = role;
    loadProducts();
}

export function handleProductClick(e) {
    if (e.target.id === 'add-product-btn') {
        showAddProductForm();
    }
    else if (e.target.classList.contains('edit-product-btn')) {
        const id = e.target.dataset.id;
        showEditProductForm(id);
    }
    else if (e.target.classList.contains('delete-product-btn')) {
        const id = e.target.dataset.id;
        deleteProduct(id);
    }
}

export function handleProductFormSubmit(e) {
    if (e.target.id === 'product-form') {
        saveProduct(e.target);
    }
}