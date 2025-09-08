import { api } from '../api.js';
import * as ui from '../ui.js';

let sales = [];
let products = [];
let customers = [];
let userRole = '';
let currentFilters = {};

function getSaleRow(sale) {
    const row = document.createElement('tr');
    row.dataset.id = sale.id;

    let actionsCell = '';
    if (userRole === 'admin') {
        actionsCell = `
            <td class="admin-only">
                <button class="btn btn-sm btn-warning edit-sale-btn" data-id="${sale.id}">Editar</button>
                <button class="btn btn-sm btn-danger delete-sale-btn" data-id="${sale.id}">Eliminar</button>
                <button class="btn btn-sm btn-info generate-invoice-btn" data-sale-id="${sale.id}">Generar Factura</button>
            </td>
        `;
    }

    const productNames = sale.items.map(item => `${item.product_name} (${item.quantity})`).join(', ');

    row.innerHTML = `
        <td>${sale.id}</td>
        <td>${productNames}</td>
        <td>${parseFloat(sale.total_amount).toFixed(2)}</td>
        <td>${new Date(sale.sale_date).toLocaleString()}</td>
        <td>${sale.customer_name || 'N/A'}</td>
        <td>${sale.notes || 'N/A'}</td>
        ${actionsCell}
    `;
    return row;
}

async function loadSales(page = 1, filters = {}) {
    currentFilters = filters;
    try {
        const result = await api.getSales(page, filters);
        sales = result.data; // Cache the sales list
        ui.renderSales(sales, result.pagination, userRole, getSaleRow, (newPage) => loadSales(newPage, currentFilters));
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
            loadSales(1, filters);
        });

        document.getElementById('clear-sale-filters').addEventListener('click', () => {
            form.reset();
            loadSales(1, {});
        });
    }
}

async function loadPrerequisites() {
    try {
        // Fetch ALL products and customers for the dropdowns by setting a high limit
        if (products.length === 0) {
            const prodResult = await api.getProducts(1, { limit: 9999 });
            products = prodResult.data;
        }
        if (customers.length === 0) {
            const customerResult = await api.getCustomers(1, { limit: 9999 });
            customers = customerResult.data;
        }
    } catch (error) {
        ui.showAlert('Error al cargar datos necesarios para el formulario: ' + error.message, 'danger');
        return false;
    }
    return true;
}

async function showAddSaleForm() {
    const ready = await loadPrerequisites();
    if (ready) {
        ui.showSaleForm(products, customers, userRole);
    }
}

async function showEditSaleForm(id) {
    const ready = await loadPrerequisites();
    if (!ready) return;

    try {
        const result = await api.getSale(id);
        ui.showSaleForm(products, customers, userRole, result.data);
    } catch (error) {
        ui.showAlert('Error al cargar datos de la venta: ' + error.message, 'danger');
    }
}

async function saveSale(form) {
    const id = form.dataset.id;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;

    const saleData = {
        customer_id: form.elements.customer_id.value || null,
        notes: form.elements.notes.value || null,
        items: []
    };

    const itemRows = form.querySelectorAll('.sale-item');
    itemRows.forEach(row => {
        saleData.items.push({
            product_id: row.querySelector('.product-select').value,
            quantity: row.querySelector('.item-quantity').value,
            unit_price: row.querySelector('.item-unit-price').value
        });
    });

    submitButton.disabled = true;
    submitButton.textContent = 'Guardando...';

    try {
        if (id) {
            await api.updateSale(id, saleData);
            ui.showAlert('Venta actualizada con éxito.');
        } else {
            await api.createSale(saleData);
            ui.showAlert('Venta registrada con éxito.');
        }
        ui.hideModal();
        loadSales();
    } catch (error) {
        ui.showAlert(`Error al guardar la venta: ${error.message}`, 'danger');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}

function deleteSale(id, button) {
    button.disabled = true;
    ui.showConfirmModal(
        'Confirmar Eliminación',
        '¿Estás seguro de que quieres eliminar esta venta? Esta acción también restaurará el stock del producto.',
        async () => {
            try {
                await api.deleteSale(id);
                ui.showAlert('Venta eliminada con éxito.');
                loadSales(); 
            } catch (error) {
                ui.showAlert('Error al eliminar la venta: ' + error.message, 'danger');
                button.disabled = false; // Re-enable only on error
            }
        }
    );

    // Re-enable button if the user closes the modal without confirming
    const modalElement = document.getElementById('form-modal');
    modalElement.addEventListener('hidden.bs.modal', () => {
        button.disabled = false;
    }, { once: true });
}

async function handleGenerateInvoice(saleId, button) {
    button.disabled = true;
    const originalButtonText = button.textContent;
    button.textContent = 'Generando...';

    try {
        const response = await api.generateInvoice(saleId);
        if (response.status === 'success') {
            ui.showAlert('Factura generada con éxito. ID: ' + response.data.id, 'success');
            // Optionally, you might want to open the preview directly or show a link
            // ui.showConfirmModal('Factura Generada', `Factura ${response.data.id} generada. ¿Desea previsualizarla?`, () => {
            //     api.previewInvoice(response.data.id);
            // });
        } else {
            ui.showAlert('Error al generar la factura: ' + response.message, 'danger');
        }
    } catch (error) {
        ui.showAlert('Error de API al generar la factura: ' + error.message, 'danger');
    } finally {
        button.disabled = false;
        button.textContent = originalButtonText;
    }
}

export function init(role) {
    userRole = role;
    loadSales();
}

export function handleSaleClick(e) {
    if (e.target.id === 'add-sale-btn') {
        showAddSaleForm();
    } else if (e.target.classList.contains('edit-sale-btn')) {
        const id = e.target.dataset.id;
        showEditSaleForm(id);
    } else if (e.target.classList.contains('delete-sale-btn')) {
        const id = e.target.dataset.id;
        deleteSale(id, e.target);
    } else if (e.target.classList.contains('generate-invoice-btn')) { // New condition
        const saleId = e.target.dataset.saleId;
        handleGenerateInvoice(saleId, e.target);
    }
}

export function handleSaleFormSubmit(e) {
    if (e.target.id === 'sale-form') {
        saveSale(e.target);
    }
}