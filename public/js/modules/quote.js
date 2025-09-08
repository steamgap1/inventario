import { api } from '../api.js';
import * as ui from '../ui.js';

let quotes = [];
let products = []; // To store products for the quote form
let customers = []; // To store customers for the quote form
let userRole = '';
let currentFilters = {};

// Template caching (assuming these templates exist in index.html)
const quoteRowTemplate = document.getElementById('quote-row-template').content;
const quoteItemFormTemplate = document.getElementById('quote-item-form-template').content;

function getQuoteRow(quote, userRole) {
    const row = document.importNode(quoteRowTemplate, true);
    const rowElement = row.querySelector('tr');
    rowElement.dataset.id = quote.id;

    row.querySelector('[data-label="ID"]').textContent = quote.id;
    row.querySelector('[data-label="Cliente"]').textContent = quote.customer_name;
    row.querySelector('[data-label="Fecha Cotización"]').textContent = new Date(quote.quote_date).toLocaleDateString();
    row.querySelector('[data-label="Válido Hasta"]').textContent = quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : 'N/A';
    row.querySelector('[data-label="Total"]').textContent = `${parseFloat(quote.total_amount).toFixed(2)}`;
    row.querySelector('[data-label="Estado"]').textContent = quote.status;

    if (userRole === 'admin') {
        row.querySelector('.view-quote-btn').dataset.id = quote.id;
        row.querySelector('.edit-quote-btn').dataset.id = quote.id;
        row.querySelector('.delete-quote-btn').dataset.id = quote.id;
        row.querySelector('.download-quote-btn').dataset.id = quote.id;
    } else {
        row.querySelector('.admin-only').remove(); // Remove actions column for non-admins
    }

    return row;
}

async function loadQuotes(page = 1, filters = {}) {
    currentFilters = filters;
    try {
        const result = await api.getQuotes(page, filters);
        quotes = result.data;
        ui.renderQuotes(quotes, result.pagination, userRole, getQuoteRow, (newPage) => loadQuotes(newPage, currentFilters));
        setupQuoteFilters();
    } catch (error) {
        ui.showAlert('Error al cargar cotizaciones: ' + error.message, 'danger');
    }
}

function setupQuoteFilters() {
    const form = document.getElementById('quote-filter-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const search = form.elements['search-quote'].value;
            const filters = { search };
            loadQuotes(1, filters);
        });

        document.getElementById('clear-quote-filters').addEventListener('click', () => {
            form.reset();
            loadQuotes(1, {});
        });
    }
}

async function showAddQuoteForm() {
    if (products.length === 0) {
        const productResult = await api.getProducts();
        products = productResult.data;
    }
    if (customers.length === 0) {
        const customerResult = await api.getCustomers();
        customers = customerResult.data;
    }
    ui.showQuoteForm({}, products, customers, userRole);
}

async function showEditQuoteForm(id) {
    if (products.length === 0) {
        const productResult = await api.getProducts();
        products = productResult.data;
    }
    if (customers.length === 0) {
        const customerResult = await api.getCustomers();
        customers = customerResult.data;
    }
    try {
        const result = await api.getQuote(id);
        const quote = result.data;
        ui.showQuoteForm(quote, products, customers, userRole);
    } catch (error) {
        ui.showAlert('Error al cargar la cotización: ' + error.message, 'danger');
    }
}

async function saveQuote(form) {
    const id = form.dataset.id;
    const quoteData = {
        customer_id: form.elements.customer_id.value,
        valid_until: form.elements.valid_until.value || null,
        notes: form.elements.notes.value || null,
        status: form.elements.status ? form.elements.status.value : 'draft',
        items: []
    };

    let totalAmount = 0;
    document.querySelectorAll('.quote-item').forEach(itemRow => {
        const productId = itemRow.querySelector('.product-select').value;
        const quantity = parseInt(itemRow.querySelector('.item-quantity').value);
        const unitPrice = parseFloat(itemRow.querySelector('.item-unit-price').value);
        const itemNotes = itemRow.querySelector('.item-notes').value;

        if (productId && quantity > 0 && unitPrice >= 0) {
            const itemTotal = quantity * unitPrice;
            totalAmount += itemTotal;
            quoteData.items.push({
                product_id: productId,
                quantity: quantity,
                unit_price: unitPrice,
                item_total: itemTotal,
                notes: itemNotes
            });
        }
    });
    quoteData.total_amount = totalAmount;

    try {
        if (id) {
            await api.updateQuote(id, quoteData);
            ui.showAlert('Cotización actualizada con éxito.');
        } else {
            await api.createQuote(quoteData);
            ui.showAlert('Cotización creada con éxito.');
        }
        ui.hideModal();
        loadQuotes(1, {});
    } catch (error) {
        ui.showAlert('Error al guardar la cotización: ' + error.message, 'danger');
    }
}

function deleteQuote(id, button) {
    button.disabled = true;
    ui.showConfirmModal(
        'Confirmar Eliminación',
        '¿Estás seguro de que quieres eliminar esta cotización?',
        async () => {
            try {
                await api.deleteQuote(id);
                ui.showAlert('Cotización eliminada con éxito.');
                loadQuotes(1, {});
            } catch (error) {
                ui.showAlert('Error al eliminar la cotización: ' + error.message, 'danger');
                button.disabled = false;
            }
        }
    );

    const modalElement = document.getElementById('form-modal');
    modalElement.addEventListener('hidden.bs.modal', () => {
        button.disabled = false;
    }, { once: true });
}

async function downloadQuotePdf(id) {
    try {
        const blob = await api.generateQuotePdf(id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `cotizacion_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    } catch (error) {
        ui.showAlert(`Error al generar el PDF: ${error.message}`, 'danger', 0);
    }
}

async function getQuoteDetails(id) {
    try {
        const result = await api.getQuote(id);
        const quote = result.data;
        ui.showQuoteDetails(quote);
    } catch (error) {
        ui.showAlert('Error al cargar los detalles de la cotización: ' + error.message, 'danger');
    }
}

export function init(role) {
    userRole = role;
    loadQuotes(1, {});
}

export function handleQuoteClick(e) {
    if (e.target.id === 'add-quote-btn') {
        showAddQuoteForm();
    } else if (e.target.classList.contains('edit-quote-btn')) {
        const id = e.target.dataset.id;
        showEditQuoteForm(id);
    } else if (e.target.classList.contains('delete-quote-btn')) {
        const id = e.target.dataset.id;
        deleteQuote(id, e.target);
    } else if (e.target.classList.contains('download-quote-btn')) {
        const id = e.target.dataset.id;
        downloadQuotePdf(id);
    } else if (e.target.classList.contains('view-quote-btn')) {
        const id = e.target.dataset.id;
        getQuoteDetails(id);
    }
}

export function handleQuoteFormSubmit(e) {
    if (e.target.id === 'quote-form') {
        saveQuote(e.target);
    }
}