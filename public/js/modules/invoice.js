import { api } from '../api.js';
import * as ui from '../ui.js'; // Assuming ui.js has renderInvoices and showInvoiceForm

let invoices = [];
let userRole = '';
let currentFilters = {};

export function init(role) {
    userRole = role;
    loadInvoices();

    // Event listeners for invoice-related actions
    const appView = document.getElementById('app-view');
    appView.removeEventListener('click', handleInvoiceClick);
    appView.addEventListener('click', handleInvoiceClick);

    const modal = document.getElementById('form-modal');
    modal.removeEventListener('submit', handleInvoiceFormSubmit);
    modal.addEventListener('submit', handleInvoiceFormSubmit);
}

function handleInvoiceClick(e) {
    if (e.target.classList.contains('edit-invoice-btn')) {
        const id = e.target.dataset.id;
        showEditInvoiceForm(id);
    } else if (e.target.classList.contains('delete-invoice-btn')) {
        const id = e.target.dataset.id;
        deleteInvoice(id, e.target);
    } else if (e.target.classList.contains('preview-invoice-btn')) {
        const id = e.target.dataset.id;
        api.previewInvoice(id);
    }
}

function setupInvoiceFilters() {
    const form = document.getElementById('invoice-filter-form');
    if (form) {
        // Prevent multiple listeners by removing old one if it exists
        form.removeEventListener('submit', handleFilterSubmit);
        form.addEventListener('submit', handleFilterSubmit);

        const clearButton = document.getElementById('clear-invoice-filters');
        if (clearButton) {
            // Prevent multiple listeners
            clearButton.removeEventListener('click', handleClearFilters);
            clearButton.addEventListener('click', handleClearFilters);
        }
    }
}

function handleFilterSubmit(e) {
    e.preventDefault();
    const searchTerm = document.getElementById('search-invoice').value;
    loadInvoices(1, { search: searchTerm });
}

function handleClearFilters() {
    const form = document.getElementById('invoice-filter-form');
    if(form){
        form.reset();
    }
    loadInvoices(1, {});
}

async function loadInvoices(page = 1, filters = {}) {
    currentFilters = filters;
    try {
        const result = await api.getInvoices(page, filters);
        invoices = result.data; // Cache the invoices list
        ui.renderInvoices(invoices, result.pagination, userRole, getInvoiceRow, (newPage) => loadInvoices(newPage, currentFilters));
        setupInvoiceFilters();
    } catch (error) {
        ui.showAlert('Error al cargar facturas: ' + error.message, 'danger');
    }
}

function getInvoiceRow(invoice) {
    const row = document.createElement('tr');
    row.dataset.id = invoice.id;

    let actionsCell = '';
    if (userRole === 'admin') {
        actionsCell = `
            <td class="admin-only">
                <button class="btn btn-sm btn-warning edit-invoice-btn" data-id="${invoice.id}">Editar</button>
                <button class="btn btn-sm btn-danger delete-invoice-btn" data-id="${invoice.id}">Eliminar</button>
                <button class="btn btn-sm btn-info preview-invoice-btn" data-id="${invoice.id}">Previsualizar</button>
            </td>
        `;
    }

    const customerInfo = invoice.customer_name ? `${invoice.customer_name} (${invoice.customer_phone || 'N/A'})` : 'N/A';
    const productNames = invoice.items.map(item => item.product_name).join(', ');

    row.innerHTML = `
        <td>${invoice.id}</td>
        <td>${invoice.sale_id}</td>
        <td>${customerInfo}</td>
        <td>${productNames}</td>
        <td>${new Date(invoice.invoice_date).toLocaleDateString()}</td>
        <td>${parseFloat(invoice.total_amount).toFixed(2)}</td>
        <td>${invoice.status}</td>
        ${actionsCell}
    `;
    return row;
}

async function showEditInvoiceForm(id) {
    try {
        const result = await api.getInvoice(id);
        ui.showInvoiceForm(result.data); // Assuming ui.js has showInvoiceForm
    } catch (error) {
        ui.showAlert('Error al cargar datos de la factura: ' + error.message, 'danger');
    }
}

export async function handleInvoiceFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    if (form.id !== 'invoice-form') return;

    const invoiceId = form.dataset.id;

    const data = {
        customer_id: form.elements['customer_id'].value,
        invoice_date: form.elements['invoice_date'].value,
        total_amount: form.elements['total_amount'].value,
        status: form.elements['status'].value,
        items: []
    };

    const itemRows = form.querySelectorAll('.invoice-item-row');
    itemRows.forEach(row => {
        data.items.push({
            product_id: row.querySelector('[name="product_id"]').value,
            product_name: row.querySelector('[name="product_name"]').value,
            quantity: row.querySelector('[name="quantity"]').value,
            unit_price: row.querySelector('[name="unit_price"]').value,
            item_total: row.querySelector('[name="item_total"]').value
        });
    });

    try {
        let response;
        if (invoiceId) {
            response = await api.updateInvoice(invoiceId, data);
        } else {
            ui.showAlert('Las facturas se generan desde las ventas.', 'info');
            return;
        }

        if (response.status === 'success') {
            ui.showAlert(response.message, 'success');
            ui.hideModal();
            loadInvoices();
        } else {
            ui.showAlert('Error al guardar la factura: ' + response.message, 'danger');
        }
    } catch (error) {
        ui.showAlert('Error de API al guardar la factura: ' + error.message, 'error');
    }
}

export async function deleteInvoice(invoiceId, button) {
    button.disabled = true;
    ui.showConfirmModal(
        'Confirmar Eliminación',
        '¿Estás seguro de que quieres eliminar esta factura?',
        async () => {
            try {
                const response = await api.deleteInvoice(invoiceId);
                if (response.status === 'success') {
                    ui.showAlert(response.message, 'success');
                    loadInvoices(); // Refresh the list
                } else {
                    ui.showAlert('Error al eliminar la factura: ' + response.message, 'error');
                }
            } catch (error) {
                ui.showAlert('Error de API al eliminar la factura: ' + error.message, 'error');
            } finally {
                button.disabled = false;
            }
        }
    );

    const modalElement = document.getElementById('form-modal');
    modalElement.addEventListener('hidden.bs.modal', () => {
        button.disabled = false;
    }, { once: true });
}