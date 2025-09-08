import { api } from '../api.js';
import * as ui from '../ui.js';

let customers = [];
let userRole = '';
let currentFilters = {};

function getCustomerRow(customer) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${customer.id}</td>
        <td>${customer.identification || 'N/A'}</td>
        <td>${customer.name}</td>
        <td>${customer.phone || 'N/A'}</td>
        <td>${customer.email || 'N/A'}</td>
        <td>${customer.address || 'N/A'}</td>
        <td class="admin-only">
            <button class="btn btn-sm btn-warning edit-customer-btn" data-id="${customer.id}">Editar</button>
            <button class="btn btn-sm btn-danger delete-customer-btn" data-id="${customer.id}">Eliminar</button>
        </td>
    `;
    return row;
}

async function loadCustomers(page = 1, filters = {}) {
    currentFilters = filters;
    try {
        const result = await api.getCustomers(page, filters);
        customers = result.data;
        ui.renderCustomers(customers, result.pagination, userRole, getCustomerRow, (newPage) => loadCustomers(newPage, currentFilters));
        setupCustomerFilters();
    } catch (error) {
        ui.showAlert('Error al cargar clientes: ' + error.message, 'danger');
    }
}

function setupCustomerFilters() {
    const form = document.getElementById('customer-filter-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const search = form.elements['search-customer'].value;
            const filters = { search };
            loadCustomers(1, filters);
        });

        document.getElementById('clear-customer-filters').addEventListener('click', () => {
            form.reset();
            loadCustomers(1, {});
        });
    }
}

async function showAddCustomerForm() {
    ui.showCustomerForm();
}

async function showEditCustomerForm(id) {
    try {
        const result = await api.getCustomer(id);
        const customer = result.data;
        ui.showCustomerForm(customer);
    } catch (error) {
        ui.showAlert('Error al cargar el cliente: ' + error.message, 'danger');
    }
}

async function saveCustomer(form) {
    const id = form.dataset.id;
    const customerData = {
        identification: form.elements.identification.value || null,
        name: form.elements.name.value,
        phone: form.elements.phone.value || null,
        email: form.elements.email.value || null,
        address: form.elements.address.value || null,
    };

    try {
        if (id) {
            await api.updateCustomer(id, customerData);
            ui.showAlert('Cliente actualizado con éxito.');
        } else {
            await api.createCustomer(customerData);
            ui.showAlert('Cliente creado con éxito.');
        }
        ui.hideModal();
        loadCustomers(1, {});
    } catch (error) {
        ui.showAlert('Error al guardar el cliente: ' + error.message, 'danger');
    }
}

function deleteCustomer(id, button) {
    button.disabled = true;
    ui.showConfirmModal(
        'Confirmar Eliminación',
        '¿Estás seguro de que quieres eliminar este cliente?',
        async () => {
            try {
                await api.deleteCustomer(id);
                ui.showAlert('Cliente eliminado con éxito.');
                loadCustomers(1, {});
            } catch (error) {
                ui.showAlert('Error al eliminar el cliente: ' + error.message, 'danger');
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
    loadCustomers(1, {});
}

export function handleCustomerClick(e) {
    if (e.target.id === 'add-customer-btn') {
        showAddCustomerForm();
    } else if (e.target.classList.contains('edit-customer-btn')) {
        const id = e.target.dataset.id;
        showEditCustomerForm(id);
    } else if (e.target.classList.contains('delete-customer-btn')) {
        const id = e.target.dataset.id;
        deleteCustomer(id, e.target);
    }
}

export function handleCustomerFormSubmit(e) {
    if (e.target.id === 'customer-form') {
        saveCustomer(e.target);
    }
}