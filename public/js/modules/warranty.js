import { api } from '../api.js';
import * as ui from '../ui.js';

let warranties = [];
let products = [];
let customers = [];
let userRole = '';
let currentFilters = {};

// Template caching
const warrantyRowTemplate = document.getElementById('warranty-row-template').content;

function getWarrantyRow(warranty, role) {
    const row = document.importNode(warrantyRowTemplate, true);
    const rowElement = row.querySelector('tr');
    rowElement.dataset.id = warranty.id;

    row.querySelector('[data-label="ID"]').textContent = warranty.id;
    row.querySelector('[data-label="Producto"]').textContent = warranty.product_name;
    row.querySelector('[data-label="Cliente"]').textContent = warranty.customer_name || 'N/A';
    row.querySelector('[data-label="Fecha Inicio"]').textContent = warranty.start_date;
    row.querySelector('[data-label="Fecha Fin"]').textContent = warranty.end_date;
    row.querySelector('[data-label="Notas"]').textContent = warranty.notes;

    const statusBadge = row.querySelector('[data-label="Estado"] .badge');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(warranty.end_date);

    let currentStatus = warranty.status;
    let statusClass = 'bg-secondary'; // Default for 'utilizada' or other statuses

    if (currentStatus.toLowerCase() === 'activa') {
        if (endDate < today) {
            currentStatus = 'Expirada';
            statusClass = 'bg-danger';
        } else {
            currentStatus = 'Activa';
            statusClass = 'bg-primary';
        }
    }

    statusBadge.textContent = currentStatus;
    statusBadge.className = 'badge'; // Reset classes
    statusBadge.classList.add(statusClass);

    if (role !== 'admin') {
        row.querySelector('[data-label="Acciones"]').remove();
    } else {
        row.querySelector('.edit-warranty-btn').dataset.id = warranty.id;
        row.querySelector('.delete-warranty-btn').dataset.id = warranty.id;
    }

    return row;
}

async function loadWarranties(page = 1, filters = {}) {
    currentFilters = filters;
    try {
        let result = await api.getWarranties(page, filters);
        warranties = result.data;

        if (products.length === 0) {
            const prodResult = await api.getProducts(1, { limit: 9999 });
            products = prodResult.data;
        }
        if (customers.length === 0) {
            const custResult = await api.getCustomers(1, { limit: 9999 });
            customers = custResult.data;
        }
        ui.renderWarranties(warranties, result.pagination, userRole, getWarrantyRow, (newPage) => loadWarranties(newPage, currentFilters));
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
            loadWarranties(1, filters);
        });

        document.getElementById('clear-warranty-filters').addEventListener('click', () => {
            form.reset();
            loadWarranties(1, {});
        });
    }
}

async function showAddWarrantyForm() {
    await loadWarranties(); // To ensure products/customers are loaded
    ui.showWarrantyForm(products, customers);
}

async function showEditWarrantyForm(id) {
    await loadWarranties(); // To ensure products/customers are loaded
    const warranty = warranties.find(w => w.id == id);
    ui.showWarrantyForm(products, customers, warranty);
}

async function saveWarranty(form) {
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    const id = form.dataset.id;
    const warrantyData = {
        product_id: form.elements.product_id.value,
        customer_id: form.elements.customer_id.value,
        start_date: form.elements.start_date.value,
        end_date: form.elements.end_date.value,
        notes: form.elements.notes.value,
        status: form.elements.status ? form.elements.status.value : 'activa'
    };

    submitButton.disabled = true;
    submitButton.textContent = 'Guardando...';

    try {
        if (id) {
            await api.updateWarranty(id, warrantyData);
            ui.showAlert('Garantía actualizada con éxito.');
        } else {
            await api.createWarranty(warrantyData);
            ui.showAlert('Garantía registrada con éxito.');
        }
        ui.hideModal();
        loadWarranties();
    } catch (error) {
        ui.showAlert('Error al guardar la garantía: ' + error.message, 'danger');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}

function deleteWarranty(id, button) {
    button.disabled = true;
    ui.showConfirmModal(
        'Confirmar Eliminación',
        '¿Estás seguro de que quieres eliminar esta garantía?',
        async () => {
            try {
                await api.deleteWarranty(id);
                ui.showAlert('Garantía eliminada con éxito.');
                loadWarranties();
            } catch (error) {
                ui.showAlert('Error al eliminar la garantía: ' + error.message, 'danger');
                button.disabled = false; // Re-enable only on error
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
    loadWarranties();
}

export function handleWarrantyClick(e) {
    if (e.target.id === 'add-warranty-btn') {
        showAddWarrantyForm();
    } else if (e.target.classList.contains('edit-warranty-btn')) {
        const id = e.target.dataset.id;
        showEditWarrantyForm(id);
    } else if (e.target.classList.contains('delete-warranty-btn')) {
        const id = e.target.dataset.id;
        deleteWarranty(id, e.target);
    }
}

export function handleWarrantyFormSubmit(e) {
    if (e.target.id === 'warranty-form') {
        saveWarranty(e.target);
    }
}