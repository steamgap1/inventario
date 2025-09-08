import { api } from '../api.js';
import * as ui from '../ui.js';

let providers = [];
let userRole = '';
let currentFilters = {};

// Template caching
const providerRowTemplate = document.getElementById('provider-row-template').content;

function getProviderRow(provider, userRole) {
    const row = document.importNode(providerRowTemplate, true);
    const rowElement = row.querySelector('tr');
    rowElement.dataset.id = provider.id;

    row.querySelector('[data-label="ID"]').textContent = provider.id;
    row.querySelector('[data-label="Nombre"]').textContent = provider.name;
    row.querySelector('[data-label="Contacto"]').textContent = provider.contact_person || 'N/A';
    row.querySelector('[data-label="Teléfono"]').textContent = provider.phone || 'N/A';
    row.querySelector('[data-label="Email"]').textContent = provider.email || 'N/A';

    if (userRole === 'admin') {
        row.querySelector('.edit-provider-btn').dataset.id = provider.id;
        row.querySelector('.delete-provider-btn').dataset.id = provider.id;
    } else {
        row.querySelectorAll('.admin-only').forEach(el => el.remove());
    }

    return row;
}

async function loadProviders(page = 1, filters = {}) {
    currentFilters = filters;
    try {
        const result = await api.getProviders(page, filters);
        providers = result.data;
        ui.renderProviders(providers, result.pagination, userRole, getProviderRow, (newPage) => loadProviders(newPage, currentFilters));
        setupProviderFilters();
    } catch (error) {
        ui.showAlert('Error al cargar proveedores: ' + error.message, 'danger');
    }
}

function setupProviderFilters() {
    const form = document.getElementById('provider-filter-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const search = form.elements['search-provider'].value;
            const filters = { search };
            loadProviders(1, filters);
        });

        document.getElementById('clear-provider-filters').addEventListener('click', () => {
            form.reset();
            loadProviders(1, {});
        });
    }
}

async function saveProvider(form) {
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
        loadProviders();
    } catch (error) {
        ui.showAlert('Error al guardar el proveedor: ' + error.message, 'danger');
    }
}

function deleteProvider(id, button) {
    button.disabled = true;
    ui.showConfirmModal(
        'Confirmar Eliminación',
        '¿Estás seguro de que quieres eliminar este proveedor? Esto no eliminará los productos asociados.',
        async () => {
            try {
                await api.deleteProvider(id);
                ui.showAlert('Proveedor eliminado con éxito.');
                loadProviders();
            } catch (error) {
                ui.showAlert('Error al eliminar el proveedor: ' + error.message, 'danger');
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
    loadProviders();
}

export function handleProviderClick(e) {
    if (e.target.id === 'add-provider-btn') {
        ui.showProviderForm();
    }
    else if (e.target.classList.contains('edit-provider-btn')) {
        const id = e.target.dataset.id;
        const provider = providers.find(p => p.id == id);
        ui.showProviderForm(provider);
    }
    else if (e.target.classList.contains('delete-provider-btn')) {
        const id = e.target.dataset.id;
        deleteProvider(id, e.target);
    }
}

export function handleProviderFormSubmit(e) {
    if (e.target.id === 'provider-form') {
        saveProvider(e.target);
    }
}
