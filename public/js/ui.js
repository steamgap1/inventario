export const appView = document.getElementById('app-view');
const alertPlaceholder = document.getElementById('alert-placeholder');
const modal = new bootstrap.Modal(document.getElementById('form-modal'));
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');

export function renderPagination(pagination, onPageClick) {
    if (!pagination || pagination.totalPages <= 1) {
        return '';
    }

    const { page, totalPages } = pagination;
    let paginationHtml = '<nav aria-label="Page navigation"><ul class="pagination justify-content-center">';

    // Previous button
    paginationHtml += `<li class="page-item ${page === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${page - 1}">Anterior</a></li>`;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        paginationHtml += `<li class="page-item ${i === page ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    }

    // Next button
    paginationHtml += `<li class="page-item ${page === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${page + 1}">Siguiente</a></li>`;

    paginationHtml += '</ul></nav>';
    
    // Add event listeners
    setTimeout(() => {
        document.querySelectorAll('.pagination .page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pageNum = parseInt(e.target.dataset.page, 10);
                if (pageNum) {
                    onPageClick(pageNum);
                }
            });
        });
    }, 0);

    return paginationHtml;
}

// --- Render Vistas Principales ---
export function renderProducts(products, pagination, userRole, getProductRow, onPageClick) {
    const actionsHeader = (userRole === 'admin') ? '<th>Acciones</th>' : '';
    const priceHeader = (userRole === 'admin') ? '<th>Costo</th><th>P. Cliente</th><th>P. Mayorista</th><th>P. Técnico</th>' : '<th>Precio</th>';

    const searchFilterForm = `
        <div class="mb-3 p-3 border rounded bg-light">
            <form id="product-filter-form" class="row g-3 align-items-end">
                <div class="col-md-4">
                    <label for="search-product" class="form-label">Buscar Producto</label>
                    <input type="text" class="form-control" id="search-product" placeholder="Nombre o descripción">
                </div>
                <div class="col-md-3">
                    <label for="stock-order" class="form-label">Ordenar por Stock</label>
                    <select class="form-select" id="stock-order">
                        <option value="">Sin ordenar</option>
                        <option value="asc">Ascendente</option>
                        <option value="desc">Descendente</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label for="price-order" class="form-label">Ordenar por Precio</label>
                    <select class="form-select" id="price-order">
                        <option value="">Sin ordenar</option>
                        <option value="asc">Ascendente</option>
                        <option value="desc">Descendente</option>
                    </select>
                </div>
                <div class="col-md-2 form-check form-switch d-flex align-items-center mb-3">
                    <input class="form-check-input" type="checkbox" id="low-stock-filter" role="switch">
                    <label class="form-check-label ms-2" for="low-stock-filter">Stock Bajo (<50)</label>
                </div>
                <div class="col-12">
                    <button type="submit" class="btn btn-primary me-2">Aplicar Filtros</button>
                    <button type="button" class="btn btn-secondary" id="clear-product-filters">Limpiar Filtros</button>
                </div>
            </form>
        </div>
    `;

    const tableHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>Productos</h2>
            ${userRole === 'admin' ? '<button id="add-product-btn" class="btn btn-primary">Añadir Producto</button>' : ''}
        </div>
        ${searchFilterForm}
        <table class="table table-hover table-sm">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Condición</th>
                    <th>Stock</th>
                    ${priceHeader}
                    <th>Proveedor</th>
                    <th>F. Entrada</th>
                    <th>Garantía Exp.</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody id="products-table-body">
            </tbody>
        </table>
        <div id="pagination-container"></div>
    `;
    appView.innerHTML = tableHTML;

    const tableBody = document.getElementById('products-table-body');
    tableBody.innerHTML = ''; // Limpiar antes de añadir
    products.forEach(product => {
        const row = getProductRow(product, userRole);
        tableBody.appendChild(row);
    });

    document.getElementById('pagination-container').innerHTML = renderPagination(pagination, onPageClick);
}

export function renderWarranties(warranties, pagination, userRole, getWarrantyRow, onPageClick) {
    const actionsHeader = (userRole === 'admin') ? '<th>Acciones</th>' : '';
    const searchFilterForm = `
        <div class="mb-3 p-3 border rounded bg-light">
            <form id="warranty-filter-form" class="row g-3 align-items-end">
                <div class="col-md-4">
                    <label for="search-warranty" class="form-label">Buscar Garantía</label>
                    <input type="text" class="form-control" id="search-warranty" placeholder="Nombre de producto o notas">
                </div>
                <div class="col-12">
                    <button type="submit" class="btn btn-primary me-2">Aplicar Filtros</button>
                    <button type="button" class="btn btn-secondary" id="clear-warranty-filters">Limpiar Filtros</button>
                </div>
            </form>
        </div>
    `;

    const tableHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>Garantías</h2>
            <button id="add-warranty-btn" class="btn btn-primary">Registrar Garantía</button>
        </div>
        ${searchFilterForm}
        <table class="table table-hover table-sm">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Producto</th>
                    <th>Fecha Inicio</th>
                    <th>Fecha Fin</th>
                    <th>Estado</th>
                    <th>Notas</th>
                    ${actionsHeader}
                </tr>
            </thead>
            <tbody id="warranties-table-body">
            </tbody>
        </table>
        <div id="pagination-container"></div>
    `;
    appView.innerHTML = tableHTML;

    const tableBody = document.getElementById('warranties-table-body');
    tableBody.innerHTML = ''; // Limpiar antes de añadir
    warranties.forEach(warranty => {
        const row = getWarrantyRow(warranty, userRole);
        tableBody.appendChild(row);
    });

    document.getElementById('pagination-container').innerHTML = renderPagination(pagination, onPageClick);
}

export function renderProviders(providers, pagination, userRole, getProviderRow, onPageClick) {
    const actionsHeader = (userRole === 'admin') ? '<th>Acciones</th>' : '';
    const searchFilterForm = `
        <div class="mb-3 p-3 border rounded bg-light">
            <form id="provider-filter-form" class="row g-3 align-items-end">
                <div class="col-md-4">
                    <label for="search-provider" class="form-label">Buscar Proveedor</label>
                    <input type="text" class="form-control" id="search-provider" placeholder="Nombre, contacto, teléfono o email">
                </div>
                <div class="col-12">
                    <button type="submit" class="btn btn-primary me-2">Aplicar Filtros</button>
                    <button type="button" class="btn btn-secondary" id="clear-provider-filters">Limpiar Filtros</button>
                </div>
            </form>
        </div>
    `;
    const tableHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>Proveedores</h2>
            ${userRole === 'admin' ? '<button id="add-provider-btn" class="btn btn-primary">Añadir Proveedor</button>' : ''}
        </div>
        ${searchFilterForm}
        <table class="table table-hover table-sm">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Contacto</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                    ${actionsHeader}
                </tr>
            </thead>
            <tbody id="providers-table-body">
            </tbody>
        </table>
        <div id="pagination-container"></div>
    `;
    appView.innerHTML = tableHTML;

    const tableBody = document.getElementById('providers-table-body');
    tableBody.innerHTML = ''; // Limpiar antes de añadir
    providers.forEach(provider => {
        const row = getProviderRow(provider, userRole);
        tableBody.appendChild(row);
    });

    document.getElementById('pagination-container').innerHTML = renderPagination(pagination, onPageClick);
}

export function renderSales(sales, pagination, userRole, getSaleRow, onPageClick) {
    const actionsHeader = (userRole === 'admin') ? '<th>Acciones</th>' : '';
    const searchFilterForm = `
        <div class="mb-3 p-3 border rounded bg-light">
            <form id="sale-filter-form" class="row g-3 align-items-end">
                <div class="col-md-4">
                    <label for="search-sale" class="form-label">Buscar Venta</label>
                    <input type="text" class="form-control" id="search-sale" placeholder="Producto o Cliente">
                </div>
                <div class="col-12">
                    <button type="submit" class="btn btn-primary me-2">Aplicar Filtros</button>
                    <button type="button" class="btn btn-secondary" id="clear-sale-filters">Limpiar Filtros</button>
                </div>
            </form>
        </div>
    `;

    const tableHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>Ventas</h2>
            <button id="add-sale-btn" class="btn btn-primary">Registrar Venta</button>
        </div>
        ${searchFilterForm}
        <table class="table table-hover table-sm">
            <thead>
                <tr>
                    <th>ID Venta</th>
                    <th>Productos</th>
                    <th>Monto Total</th>
                    <th>Fecha Venta</th>
                    <th>Cliente</th>
                    <th>Notas</th>
                    ${actionsHeader}
                </tr>
            </thead>
            <tbody id="sales-table-body">
            </tbody>
        </table>
        <div id="pagination-container"></div>
    `;
    appView.innerHTML = tableHTML;

    const tableBody = document.getElementById('sales-table-body');
    tableBody.innerHTML = ''; // Limpiar antes de añadir
    sales.forEach(sale => {
        const row = getSaleRow(sale);
        tableBody.appendChild(row);
    });

    document.getElementById('pagination-container').innerHTML = renderPagination(pagination, onPageClick);
}

export function renderQuotes(quotes, pagination, userRole, getQuoteRow, onPageClick) {
    const searchFilterForm = `
        <div class="mb-3 p-3 border rounded bg-light">
            <form id="quote-filter-form" class="row g-3 align-items-end">
                <div class="col-md-4">
                    <label for="search-quote" class="form-label">Buscar Cotización</label>
                    <input type="text" class="form-control" id="search-quote" placeholder="Nombre de cliente o notas">
                </div>
                <div class="col-12">
                    <button type="submit" class="btn btn-primary me-2">Aplicar Filtros</button>
                    <button type="button" class="btn btn-secondary" id="clear-quote-filters">Limpiar Filtros</button>
                </div>
            </form>
        </div>
    `;

    const tableHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>Cotizaciones</h2>
            ${userRole === 'admin' ? '<button id="add-quote-btn" class="btn btn-primary">Crear Cotización</button>' : ''}
        </div>
        ${searchFilterForm}
        <table class="table table-hover table-sm">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Fecha Cotización</th>
                    <th>Válido Hasta</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody id="quotes-table-body">
            </tbody>
        </table>
        <div id="pagination-container"></div>
    `;
    appView.innerHTML = tableHTML;

    const tableBody = document.getElementById('quotes-table-body');
    tableBody.innerHTML = ''; // Limpiar antes de añadir
    quotes.forEach(quote => {
        const row = getQuoteRow(quote, userRole);
        tableBody.appendChild(row);
    });

    document.getElementById('pagination-container').innerHTML = renderPagination(pagination, onPageClick);
}

export function renderReports() {
    const reportsHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>Reportes</h2>
        </div>
        <div class="mb-3 p-3 border rounded bg-light">
            <div class="row g-3 align-items-end">
                <div class="col-md-4">
                    <label for="report-type-select" class="form-label">Tipo de Reporte</label>
                    <select class="form-select" id="report-type-select">
                        <option value="products">Inventario General</option>
                        <option value="sales">Ventas</option>
                        <option value="providers">Proveedores</option>
                        <option value="warranties">Garantías</option>
                        <option value="low_stock">Productos con Bajo Stock</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <button id="view-report-btn" class="btn btn-primary">Ver Reporte</button>
                    <button id="generate-pdf-btn" class="btn btn-secondary">Generar PDF</button>
                </div>
            </div>
        </div>
        <div id="report-display-area" class="mt-4">
            <!-- El reporte se mostrará aquí -->
        </div>
    `;
    appView.innerHTML = reportsHTML;
}

export function renderCustomers(customers, pagination, userRole, getCustomerRow, onPageClick) {
    const actionsHeader = (userRole === 'admin') ? '<th>Acciones</th>' : '';
    const searchFilterForm = `
        <div class="mb-3 p-3 border rounded bg-light">
            <form id="customer-filter-form" class="row g-3 align-items-end">
                <div class="col-md-4">
                    <label for="search-customer" class="form-label">Buscar Cliente</label>
                    <input type="text" class="form-control" id="search-customer" placeholder="Nombre, identificación o email">
                </div>
                <div class="col-12">
                    <button type="submit" class="btn btn-primary me-2">Aplicar Filtros</button>
                    <button type="button" class="btn btn-secondary" id="clear-customer-filters">Limpiar Filtros</button>
                </div>
            </form>
        </div>
    `;
    const tableHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>Clientes</h2>
            ${userRole === 'admin' ? '<button id="add-customer-btn" class="btn btn-primary">Añadir Cliente</button>' : ''}
        </div>
        ${searchFilterForm}
        <table class="table table-hover table-sm">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Identificación</th>
                    <th>Nombre</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                    <th>Dirección</th>
                    ${actionsHeader}
                </tr>
            </thead>
            <tbody id="customers-table-body">
            </tbody>
        </table>
        <div id="pagination-container"></div>
    `;
    appView.innerHTML = tableHTML;

    const tableBody = document.getElementById('customers-table-body');
    tableBody.innerHTML = ''; // Limpiar antes de añadir
    customers.forEach(customer => {
        const row = getCustomerRow(customer, userRole);
        tableBody.appendChild(row);
    });

    document.getElementById('pagination-container').innerHTML = renderPagination(pagination, onPageClick);
}

export function showCustomerForm(customer = {}) {
    const isEdit = !!customer.id;
    modalTitle.textContent = isEdit ? 'Editar Cliente' : 'Añadir Cliente';

    const formHTML = `
        <form id="customer-form" data-id="${customer.id || ''}">
            <div class="mb-3">
                <label for="identification" class="form-label">Identificación</label>
                <input type="text" class="form-control" id="identification" value="${customer.identification || ''}">
            </div>
            <div class="mb-3">
                <label for="name" class="form-label">Nombre</label>
                <input type="text" class="form-control" id="name" value="${customer.name || ''}" required>
            </div>
            <div class="mb-3">
                <label for="phone" class="form-label">Teléfono</label>
                <input type="text" class="form-control" id="phone" value="${customer.phone || ''}">
            </div>
            <div class="mb-3">
                <label for="email" class="form-label">Email</label>
                <input type="email" class="form-control" id="email" value="${customer.email || ''}">
            </div>
            <div class="mb-3">
                <label for="address" class="form-label">Dirección</label>
                <input type="text" class="form-control" id="address" value="${customer.address || ''}">
            </div>
            <div class="d-grid">
                <button type="submit" class="btn btn-primary">${isEdit ? 'Actualizar' : 'Guardar'}</button>
            </div>
        </form>
    `;

    modalBody.innerHTML = formHTML;
    modal.show();
}

export function showProductForm(product = {}, providers = []) {
    const isEdit = !!product.id;
    modalTitle.textContent = isEdit ? 'Editar Producto' : 'Añadir Producto';

    const formTemplate = document.getElementById('product-form-template').content.cloneNode(true);
    const form = formTemplate.querySelector('#product-form');

    if (isEdit) {
        form.dataset.id = product.id;
        form.elements.name.value = product.name || '';
        form.elements.description.value = product.description || '';
        form.elements.stock.value = product.stock || 0;
        form.elements.condition.value = product.condition || 'nuevo';
        form.elements.cost.value = product.cost || 0;
        form.elements.price_client.value = product.price_client || 0;
        form.elements.price_wholesale.value = product.price_wholesale || 0;
        form.elements.price_technician.value = product.price_technician || 0;
        form.elements.provider_id.value = product.provider_id || '';
        form.elements.entry_date.value = product.entry_date || '';
        form.elements.warranty_expires_on.value = product.warranty_expires_on || '';
        form.querySelector('button[type="submit"]').textContent = 'Actualizar';
    }

    const providerSelect = form.elements.provider_id;
    providers.forEach(p => {
        const option = new Option(p.name, p.id);
        if (isEdit && product.provider_id == p.id) {
            option.selected = true;
        }
        providerSelect.add(option);
    });

    modalBody.innerHTML = '';
    modalBody.appendChild(formTemplate);
    modal.show();
}

export function showWarrantyForm(products, customers, warranty = {}) {
    const isEdit = !!warranty.id;
    modalTitle.textContent = isEdit ? 'Editar Garantía' : 'Registrar Garantía';

    const formTemplate = document.getElementById('warranty-form-template').content.cloneNode(true);
    const form = formTemplate.querySelector('#warranty-form');

    const today = new Date().toISOString().split('T')[0];
    form.elements.start_date.min = today;
    form.elements.end_date.min = today;

    if (isEdit) {
        form.dataset.id = warranty.id;
        form.elements.product_id.value = warranty.product_id || '';
        form.elements.customer_id.value = warranty.customer_id || '';
        form.elements.start_date.value = warranty.start_date || '';
        form.elements.end_date.value = warranty.end_date || '';
        form.elements.notes.value = warranty.notes || '';
        form.elements.status.value = warranty.status || 'activa';
        form.querySelector('button[type="submit"]').textContent = 'Actualizar';
    }

    const productSelect = form.elements.product_id;
    products.forEach(p => {
        const option = new Option(p.name, p.id);
        if (warranty.product_id == p.id) {
            option.selected = true;
        }
        productSelect.add(option);
    });

    const customerSelect = form.elements.customer_id;
    customers.forEach(c => {
        const option = new Option(c.name, c.id);
        if (isEdit && warranty.customer_id == c.id) {
            option.selected = true;
        }
        customerSelect.add(option);
    });

    modalBody.innerHTML = '';
    modalBody.appendChild(formTemplate);
    modal.show();
}

export function showProviderForm(provider = {}) {
    const isEdit = !!provider.id;
    modalTitle.textContent = isEdit ? 'Editar Proveedor' : 'Añadir Proveedor';

    const formTemplate = document.getElementById('provider-form-template').content.cloneNode(true);
    const form = formTemplate.querySelector('#provider-form');

    if (isEdit) {
        form.dataset.id = provider.id;
        form.elements.name.value = provider.name || '';
        form.elements.contact_person.value = provider.contact_person || '';
        form.elements.phone.value = provider.phone || '';
        form.elements.email.value = provider.email || '';
        form.querySelector('button[type="submit"]').textContent = 'Actualizar';
    }

    modalBody.innerHTML = '';
    modalBody.appendChild(formTemplate);
    modal.show();
}

export function showSaleForm(products, customers, userRole, sale = {}) {
    const isEdit = !!sale.id;
    modalTitle.textContent = isEdit ? 'Editar Venta' : 'Registrar Venta';

    const getPriceForRole = (product, role) => {
        switch (role) {
            case 'admin':
            case 'cliente':
            default:
                return product.price_client;
            case 'mayorista':
                return product.price_wholesale;
            case 'tecnico':
                return product.price_technician;
        }
    };

    modalBody.innerHTML = `
        <form id="sale-form" data-id="${sale.id || ''}">
            <div class="mb-3">
                <label for="customer_id" class="form-label">Cliente (Opcional)</label>
                <select class="form-select" id="customer_id" name="customer_id">
                    <option value="">Venta sin cliente</option>
                    ${customers.map(c => {
                        const selected = (isEdit && c.id == sale.customer_id) ? 'selected' : '';
                        return `<option value="${c.id}" ${selected}>${c.name}</option>`;
                    }).join('')}
                </select>
            </div>
            <div class="mb-3">
                <label for="notes" class="form-label">Notas (Opcional)</label>
                <textarea class="form-control" id="notes" name="notes" rows="3">${sale.notes || ''}</textarea>
            </div>

            <h4>Artículos de la Venta</h4>
            <div id="sale-items-container">
                <!-- Sale items will be added here dynamically -->
            </div>
            <button type="button" class="btn btn-secondary btn-sm mt-2" id="add-sale-item-btn">Añadir Artículo</button>

            <div class="d-grid mt-3">
                <button type="submit" class="btn btn-primary">${isEdit ? 'Actualizar Venta' : 'Registrar Venta'}</button>
            </div>
        </form>
    `;

    modal.show();

    const addSaleItemRow = (item = {}) => {
        const container = document.getElementById('sale-items-container');
        const itemRow = document.importNode(document.getElementById('sale-item-form-template').content, true);
        const productSelect = itemRow.querySelector('.product-select');
        products.forEach(p => {
            const option = new Option(p.name, p.id);
            productSelect.add(option);
        });
        if (item.product_id) {
            productSelect.value = item.product_id;
        }
        itemRow.querySelector('.item-quantity').value = item.quantity || 1;
        itemRow.querySelector('.item-unit-price').value = item.unit_price || '';
        container.appendChild(itemRow);
    };

    if (isEdit && sale.items) {
        sale.items.forEach(item => addSaleItemRow(item));
    } else {
        addSaleItemRow();
    }

    modalBody.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'add-sale-item-btn') {
            addSaleItemRow();
        }
        if (e.target && e.target.classList.contains('remove-item-btn')) {
            e.target.closest('.sale-item').remove();
        }
    });

    modalBody.addEventListener('change', (e) => {
        if (e.target && e.target.classList.contains('product-select')) {
            const selectedOption = e.target.options[e.target.selectedIndex];
            const productId = selectedOption.value;
            const product = products.find(p => p.id == productId);
            if (product) {
                const price = getPriceForRole(product, userRole);
                e.target.closest('.sale-item').querySelector('.item-unit-price').value = parseFloat(price).toFixed(2);
            }
        }
    });
}

export function showQuoteDetails(quote) {
    modalTitle.textContent = `Detalles de la Cotización #${quote.id}`;

    let itemsHtml = '';
    quote.items.forEach(item => {
        itemsHtml += `
            <tr>
                <td>${item.product_name}</td>
                <td>${item.quantity}</td>
                <td>${parseFloat(item.unit_price).toFixed(2)}</td>
                <td>${parseFloat(item.item_total).toFixed(2)}</td>
                <td>${item.notes || ''}</td>
            </tr>
        `;
    });

    const detailsHtml = `
        <div>
            <h5>Cliente</h5>
            <p><strong>Nombre:</strong> ${quote.customer_name}</p>
            <p><strong>Email:</strong> ${quote.customer_email || 'N/A'}</p>
            <p><strong>Teléfono:</strong> ${quote.customer_phone || 'N/A'}</p>
        </div>
        <hr>
        <div>
            <h5>Detalles de la Cotización</h5>
            <p><strong>Fecha:</strong> ${new Date(quote.quote_date).toLocaleDateString()}</p>
            <p><strong>Válido Hasta:</strong> ${quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Estado:</strong> ${quote.status}</p>
            <p><strong>Notas:</strong> ${quote.notes || ''}</p>
        </div>
        <hr>
        <h5>Artículos</h5>
        <table class="table table-sm">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio Unit.</th>
                    <th>Total</th>
                    <th>Notas</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>
        <div class="text-end">
            <h5>Total: ${parseFloat(quote.total_amount).toFixed(2)}</h5>
        </div>
    `;

    modalBody.innerHTML = detailsHtml;
    modal.show();
}

export function showQuoteForm(quote = {}, products = [], customers = [], userRole) {
    const isEdit = !!quote.id;
    modalTitle.textContent = isEdit ? 'Editar Cotización' : 'Crear Cotización';

    const formTemplate = document.getElementById('quote-form-template').content.cloneNode(true);
    const form = formTemplate.querySelector('#quote-form');

    if (isEdit) {
        form.dataset.id = quote.id;
        form.elements.customer_id.value = quote.customer_id || '';
        form.elements.valid_until.value = quote.valid_until || '';
        form.elements.notes.value = quote.notes || '';
        form.elements.status.value = quote.status || 'draft';
        form.querySelector('button[type="submit"]').textContent = 'Actualizar';

        // Populate existing items
        const itemsContainer = form.querySelector('#quote-items-container');
        quote.items.forEach(item => {
            const itemRow = document.importNode(document.getElementById('quote-item-form-template').content, true);
            const productSelect = itemRow.querySelector('.product-select');
            products.forEach(p => {
                const option = new Option(p.name, p.id);
                productSelect.add(option);
            });
            productSelect.value = item.product_id;
            itemRow.querySelector('.item-quantity').value = item.quantity;
            itemRow.querySelector('.item-unit-price').value = item.unit_price;
            itemRow.querySelector('.item-notes').value = item.notes;
            itemsContainer.appendChild(itemRow);
        });
    }

    const customerSelect = form.elements.customer_id;
    customers.forEach(c => {
        const option = new Option(c.name, c.id);
        if (isEdit && quote.customer_id == c.id) {
            option.selected = true;
        }
        customerSelect.add(option);
    });

    modalBody.innerHTML = '';
    modalBody.appendChild(formTemplate);

    // Event delegation for add, remove, and change events
    modalBody.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'add-quote-item-btn') {
            const itemsContainer = modalBody.querySelector('#quote-items-container');
            const itemRow = document.importNode(document.getElementById('quote-item-form-template').content, true);
            const productSelect = itemRow.querySelector('.product-select');
            products.forEach(p => {
                const option = new Option(p.name, p.id);
                productSelect.add(option);
            });
            itemsContainer.appendChild(itemRow);
        }

        if (e.target && e.target.classList.contains('remove-item-btn')) {
            e.target.closest('.quote-item').remove();
        }
    });

    modalBody.addEventListener('change', (e) => {
        if (e.target && e.target.classList.contains('product-select')) {
            const selectedOption = e.target.options[e.target.selectedIndex];
            const productId = selectedOption.value;
            const product = products.find(p => p.id == productId);
            if (product) {
                e.target.closest('.quote-item').querySelector('.item-unit-price').value = parseFloat(product.price_client).toFixed(2);
            }
        }
    });


    // If it's a new quote, add one item row by default
    if (!isEdit && modalBody.querySelectorAll('.quote-item').length === 0) {
        modalBody.querySelector('#add-quote-item-btn').click();
    }

    modal.show();
}

export function showConfirmModal(title, body, onConfirm) {
    modalTitle.textContent = title;
    modalBody.innerHTML = `
        <p>${body}</p>
        <div class="d-flex justify-content-end">
            <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" id="modal-confirm-btn">Confirmar</button>
        </div>
    `;

    const confirmBtn = document.getElementById('modal-confirm-btn');
    confirmBtn.addEventListener('click', () => {
        onConfirm();
        modal.hide();
    }, { once: true }); // Use { once: true } to auto-remove the listener

    modal.show();
}

// --- Helpers ---
export function hideModal() {
    modal.hide();
}

export function showAlert(message, type = 'success', duration = 4000) {
    const alertWrapper = document.createElement('div');
    alertWrapper.innerHTML = `<div class="alert alert-${type} alert-dismissible" role="alert">${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
    alertPlaceholder.append(alertWrapper);

    if (duration > 0) {
        setTimeout(() => {
            const alert = bootstrap.Alert.getOrCreateInstance(alertWrapper.firstChild);
            if (alert) alert.close();
        }, duration);
    }
}

export function renderReportDataInView(title, report) {
    const displayArea = document.getElementById('report-display-area');
    if (!report || !report.headers || !report.data) {
        displayArea.innerHTML = '<p>No hay datos para mostrar.</p>';
        return;
    }

    let summaryHtml = '';
    if (report.summary && report.summary.length > 0) {
        summaryHtml = `
            <div class="card bg-light mb-4">
                <div class="card-body">
                    <h5 class="card-title">Resumen del Reporte</h5>
                    <ul class="list-group list-group-flush">
                        ${report.summary.map(item => `<li class="list-group-item d-flex justify-content-between align-items-center">${item.label}<span class="badge bg-primary rounded-pill">${item.value}</span></li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    const headers = report.headers.map(h => `<th>${h}</th>`).join('');
    const rows = report.data.map(row => {
        const cells = Object.values(row).map(cell => `<td>${cell !== null ? cell : 'N/A'}</td>`).join('');
        return `<tr>${cells}</tr>`;
    }).join('');

    const tableHtml = `
        <h3 class="mt-4">${title}</h3>
        ${summaryHtml}
        <div class="table-responsive">
            <table class="table table-striped table-sm">
                <thead>
                    <tr>${headers}</tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;

    displayArea.innerHTML = tableHtml;
}

export function renderNotificationsPanel(notifications, markAsReadCallback) {
    const notificationsList = document.getElementById('notifications-list');
    notificationsList.innerHTML = ''; // Clear existing notifications

    if (notifications.length === 0) {
        notificationsList.innerHTML = '<li class="dropdown-item text-muted">No hay notificaciones.</li>';
        return;
    }

    notifications.forEach(notification => {
        const notificationItem = document.createElement('li');
        notificationItem.dataset.id = notification.id;
        notificationItem.classList.add('dropdown-item', 'd-flex', 'justify-content-between', 'align-items-start');
        if (!notification.is_read) {
            notificationItem.classList.add('fw-bold'); // Make unread notifications bold
        }

        let messageContent = notification.message;
        if (notification.link) {
            messageContent = `<a href="#" class="notification-link" data-route="${notification.link}">${notification.message}</a>`;
        }

        const timestamp = new Date(notification.created_at).toLocaleString();

        notificationItem.innerHTML = `
            <div>
                ${messageContent}
                <div class="text-muted small">${timestamp}</div>
            </div>
            <button class="btn btn-sm btn-outline-secondary ms-2 mark-as-read-btn" data-id="${notification.id}" title="Marcar como leída">
                <i class="bi bi-check-lg"></i>
            </button>
        `;
        notificationsList.appendChild(notificationItem);
    });
}

export function renderAllNotificationsPage(notificationsData, markAsReadCallback, showAllNotificationsPageCallback) {
    const notifications = notificationsData.notifications || [];
    const pagination = notificationsData.pagination || {};

    let notificationsHtml = '';
    if (notifications.length === 0) {
        notificationsHtml = '<p>No hay notificaciones para mostrar.</p>';
    } else {
        notificationsHtml = `
            <ul class="list-group">
                ${notifications.map(notification => {
                    const timestamp = new Date(notification.created_at).toLocaleString();
                    const isReadClass = notification.is_read ? '' : 'fw-bold';
                    let messageContent = notification.message;
                    if (notification.link) {
                        messageContent = `<a href="#" class="notification-link" data-route="${notification.link}">${notification.message}</a>`;
                    }
                    return `
                        <li class="list-group-item d-flex justify-content-between align-items-start ${isReadClass}" data-id="${notification.id}">
                            <div>
                                ${messageContent}
                                <div class="text-muted small">${timestamp}</div>
                            </div>
                            <button class="btn btn-sm btn-outline-secondary ms-2 mark-as-read-btn" data-id="${notification.id}" title="Marcar como leída">
                                <i class="bi bi-check-lg"></i>
                            </button>
                        </li>
                    `;
                }).join('')}
            </ul>
        `;
    }

    let paginationHtml = '';
    if (pagination.totalPages > 1) {
        paginationHtml = `
            <nav aria-label="Page navigation">
                <ul class="pagination justify-content-center mt-3">
                    <li class="page-item ${pagination.currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="${pagination.currentPage - 1}">Anterior</a>
                    </li>
                    ${Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => `
                        <li class="page-item ${page === pagination.currentPage ? 'active' : ''}">
                            <a class="page-link" href="#" data-page="${page}">${page}</a>
                        </li>
                    `).join('')}
                    <li class="page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="${pagination.currentPage + 1}">Siguiente</a>
                    </li>
                </ul>
            </nav>
        `;
    }

    const fullPageHtml = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>Todas las Notificaciones</h2>
        </div>
        ${notificationsHtml}
        ${paginationHtml}
    `;

    appView.innerHTML = fullPageHtml;

    // Add event listeners for pagination buttons
    if (pagination.totalPages > 1) {
        appView.querySelectorAll('.page-link').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (!isNaN(page)) {
                    showAllNotificationsPageCallback(page);
                }
            });
        });
    }

    // Add event listeners for mark as read buttons
    appView.querySelectorAll('.mark-as-read-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event from bubbling up to appView
            const notificationId = e.currentTarget.dataset.id;
            markAsReadCallback(notificationId);
        });
    });

    // Add event listeners for notification links
    appView.querySelectorAll('.notification-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event from bubbling up to appView
            e.preventDefault();
            const route = e.currentTarget.dataset.route;
            if (route) {
                // Assuming app.navigate is available globally or passed down
                // For now, we'll just log it, as app.navigate is in app.js
                console.log('Navigating to:', route);
                // You might need to dispatch a custom event or pass app.navigate directly
                // to handle navigation from here.
            }
        });
    });
}

export function renderInvoices(invoices, pagination, userRole, getInvoiceRow, onPageClick) {
    const actionsHeader = (userRole === 'admin') ? '<th>Acciones</th>' : '';
    const tableHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>Facturas</h2>
            <!-- No "Add Invoice" button here, as invoices are generated from sales -->
        </div>
        <div class="mb-3 p-3 border rounded bg-light">
            <form id="invoice-filter-form" class="row g-3 align-items-end">
                <div class="col-md-4">
                    <label for="search-invoice" class="form-label">Buscar Factura</label>
                    <input type="text" class="form-control" id="search-invoice" placeholder="ID de Venta o Cliente">
                </div>
                <div class="col-12">
                    <button type="submit" class="btn btn-primary me-2">Aplicar Filtros</button>
                    <button type="button" class="btn btn-secondary" id="clear-invoice-filters">Limpiar Filtros</button>
                </div>
            </form>
        </div>
        <table class="table table-hover table-sm">
            <thead>
                <tr>
                    <th>ID Factura</th>
                    <th>ID Venta</th>
                    <th>Cliente</th>
                    <th>Productos</th>
                    <th>Fecha</th>
                    <th>Monto Total</th>
                    <th>Estado</th>
                    ${actionsHeader}
                </tr>
            </thead>
            <tbody id="invoices-table-body">
            </tbody>
        </table>
        <div id="pagination-container"></div>
    `;
    appView.innerHTML = tableHTML;

    const tableBody = document.getElementById('invoices-table-body');
    tableBody.innerHTML = ''; // Limpiar antes de añadir
    invoices.forEach(invoice => {
        const row = getInvoiceRow(invoice, userRole);
        tableBody.appendChild(row);
    });

    document.getElementById('pagination-container').innerHTML = renderPagination(pagination, onPageClick);
}

export function showInvoiceForm(invoice = {}) {
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const form = document.createElement('form');
    form.id = 'invoice-form';
    form.dataset.id = invoice.id || '';

    modalTitle.textContent = invoice.id ? 'Editar Factura' : 'Nueva Factura'; // Invoices are generated, not created directly

    modalBody.innerHTML = ''; // Clear previous content

    form.innerHTML = `
        <div class="mb-3">
            <label for="invoice-sale-id" class="form-label">ID de Venta</label>
            <input type="number" class="form-control" id="invoice-sale-id" name="sale_id" value="${invoice.sale_id || ''}" ${invoice.id ? 'disabled' : ''} required>
        </div>
        <div class="mb-3">
            <label for="invoice-customer-id" class="form-label">ID de Cliente</label>
            <input type="number" class="form-control" id="invoice-customer-id" name="customer_id" value="${invoice.customer_id || ''}" required>
        </div>
        <div class="mb-3">
            <label for="invoice-date" class="form-label">Fecha de Factura</label>
            <input type="date" class="form-control" id="invoice-date" name="invoice_date" value="${invoice.invoice_date || ''}" required>
        </div>
        <div class="mb-3">
            <label for="invoice-total-amount" class="form-label">Monto Total</label>
            <input type="number" step="0.01" class="form-control" id="invoice-total-amount" name="total_amount" value="${invoice.total_amount || ''}" required>
        </div>
        <div class="mb-3">
            <label for="invoice-status" class="form-label">Estado</label>
            <select class="form-select" id="invoice-status" name="status" required>
                <option value="unpaid" ${invoice.status === 'unpaid' ? 'selected' : ''}>Impaga</option>
                <option value="paid" ${invoice.status === 'paid' ? 'selected' : ''}>Pagada</option>
                <option value="cancelled" ${invoice.status === 'cancelled' ? 'selected' : ''}>Cancelada</option>
            </select>
        </div>
        <div class="mb-3">
            <h5>Items de Factura</h5>
            <div id="invoice-items-container">
                <!-- Items will be dynamically added here -->
            </div>
            <button type="button" class="btn btn-sm btn-secondary mt-2" id="add-invoice-item-btn">Agregar Item</button>
        </div>
        <button type="submit" class="btn btn-primary">Guardar Factura</button>
    `;

    modalBody.appendChild(form);
    modal.show();

    // Populate items if editing
    if (invoice.items && invoice.items.length > 0) {
        invoice.items.forEach(item => addInvoiceItemRow(item));
    } else {
        // Add one empty item row for new invoices (though they are generated)
        addInvoiceItemRow();
    }

    // Event listener for adding new items
    document.getElementById('add-invoice-item-btn').addEventListener('click', () => addInvoiceItemRow());
}

function addInvoiceItemRow(item = {}) {
    const container = document.getElementById('invoice-items-container');
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('row', 'mb-2', 'invoice-item-row');
    itemDiv.innerHTML = `
        <input type="hidden" name="product_id" value="${item.product_id || ''}">
        <div class="col-md-4">
            <input type="text" class="form-control" name="product_name" placeholder="Producto" value="${item.product_name || ''}" required>
        </div>
        <div class="col-md-2">
            <input type="number" class="form-control" name="quantity" placeholder="Cantidad" value="${item.quantity || ''}" required>
        </div>
        <div class="col-md-3">
            <input type="number" step="0.01" class="form-control" name="unit_price" placeholder="Precio Unitario" value="${item.unit_price || ''}" required>
        </div>
        <div class="col-md-2">
            <input type="number" step="0.01" class="form-control" name="item_total" placeholder="Total" value="${item.item_total || ''}" readonly>
        </div>
        <div class="col-md-1">
            <button type="button" class="btn btn-danger btn-sm remove-invoice-item-btn">X</button>
        </div>
    `;
    container.appendChild(itemDiv);

    // Event listener for removing item
    itemDiv.querySelector('.remove-invoice-item-btn').addEventListener('click', (e) => {
        e.target.closest('.invoice-item-row').remove();
    });

    // Event listeners for calculating item_total
    const quantityInput = itemDiv.querySelector('input[name="quantity"]');
    const unitPriceInput = itemDiv.querySelector('input[name="unit_price"]');
    const itemTotalInput = itemDiv.querySelector('input[name="item_total"]');

    const calculateItemTotal = () => {
        const quantity = parseFloat(quantityInput.value) || 0;
        const unitPrice = parseFloat(unitPriceInput.value) || 0;
        itemTotalInput.value = (quantity * unitPrice).toFixed(2);
    };

    quantityInput.addEventListener('input', calculateItemTotal);
    unitPriceInput.addEventListener('input', calculateItemTotal);
}
