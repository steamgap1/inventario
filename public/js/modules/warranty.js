import { api } from '../api.js';
import * as ui from '../ui.js';

let warranties = [];
let products = [];

async function loadWarranties(filters = {}) {
    try {
        const result = await api.getWarranties(filters);
        warranties = result.data;
        // Necesitamos los productos para el formulario de añadir garantía
        if (products.length === 0) {
            const prodResult = await api.getProducts();
            products = prodResult.data;
        }
        ui.renderWarranties(warranties);
        setupWarrantyFilters();
    } catch (error) {
        ui.showAlert('Error al cargar garantías: ' + error.message, 'danger');
    }
}

function setupWarrantyFilters() {
    const form = document.getElementById('warranty-filter-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const search = form.elements['search-warranty'].value;
            const filters = { search };
            loadWarranties(filters);
        });

        document.getElementById('clear-warranty-filters').addEventListener('click', () => {
            form.reset();
            loadWarranties({}); // Load all warranties
        });
    }
}

async function showAddWarrantyForm() {
    if (products.length === 0) {
        await loadProducts();
    }
    ui.showWarrantyForm(products);
}

async function saveWarranty(form) {
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
        loadWarranties();
    } catch (error) {
        ui.showAlert('Error al registrar la garantía: ' + error.message, 'danger');
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

export function init() {
    loadWarranties();
}

export function handleWarrantyClick(e) {
    if (e.target.id === 'add-warranty-btn') {
        showAddWarrantyForm();
    }
}

export function handleWarrantyFormSubmit(e) {
    if (e.target.id === 'warranty-form') {
        saveWarranty(e.target);
    }
}