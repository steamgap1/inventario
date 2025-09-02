
import { api } from '../api.js';
import * as ui from '../ui.js';

let providers = [];
let userRole = '';

function getProviderRow(provider, userRole) {
    const actions = (userRole === 'admin') ? `
        <td>
            <button class="btn btn-sm btn-warning edit-provider-btn" data-id="${provider.id}">Editar</button>
            <button class="btn btn-sm btn-danger delete-provider-btn" data-id="${provider.id}">Eliminar</button>
        </td>
    ` : '';
    return `
        <tr data-id="${provider.id}">
            <td>${provider.id}</td>
            <td>${provider.name}</td>
            <td>${provider.contact_person || 'N/A'}</td>
            <td>${provider.phone || 'N/A'}</td>
            <td>${provider.email || 'N/A'}</td>
            ${actions}
        </tr>
    `;
}

async function loadProviders(filters = {}) {
    try {
        const result = await api.getProviders(filters);
        providers = result.data;
        ui.renderProviders(providers, userRole, getProviderRow);
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
            loadProviders(filters);
        });

        document.getElementById('clear-provider-filters').addEventListener('click', () => {
            form.reset();
            loadProviders({}); // Load all providers
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

async function deleteProvider(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este proveedor? Esto no eliminará los productos asociados.')) {
        try {
            await api.deleteProvider(id);
            ui.showAlert('Proveedor eliminado con éxito.');
            loadProviders();
        } catch (error) {
            ui.showAlert('Error al eliminar el proveedor: ' + error.message, 'danger');
        }
    }
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
        deleteProvider(id);
    }
}

export function handleProviderFormSubmit(e) {
    if (e.target.id === 'provider-form') {
        saveProvider(e.target);
    }
}