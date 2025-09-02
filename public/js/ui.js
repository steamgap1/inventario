// public/js/ui.js

const ui = {
    appView: document.getElementById('app-view'),
    modal: new bootstrap.Modal(document.getElementById('form-modal')),
    modalTitle: document.getElementById('modal-title'),
    modalBody: document.getElementById('modal-body'),

    // --- Render Vistas Principales ---
    renderProducts(products, userRole) {
        const actionsHeader = (userRole === 'admin') ? '<th>Acciones</th>' : '';
        const priceHeader = (userRole === 'admin') ? '<th>Costo</th><th>P. Cliente</th><th>P. Mayorista</th><th>P. Técnico</th>' : '<th>Precio</th>';
        const providerHeader = '<th>Proveedor</th>';
        const conditionHeader = '<th>Condición</th>';
        const entryDateHeader = '<th>F. Entrada</th>';
        const warrantyExpHeader = '<th>Garantía Exp.</th>';

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

        const table = `
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
                        ${conditionHeader}
                        <th>Stock</th>
                        ${priceHeader}
                        ${providerHeader}
                        ${entryDateHeader}
                        ${warrantyExpHeader}
                        ${actionsHeader}
                    </tr>
                </thead>
                <tbody>
                    ${products.map(p => this.getProductRow(p, userRole)).join('')}
                </tbody>
            </table>
        `;
        this.appView.innerHTML = table;
    },

    renderWarranties(warranties) {
        const table = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h2>Garantías</h2>
                <button id="add-warranty-btn" class="btn btn-primary">Registrar Garantía</button>
            </div>
            <table class="table table-hover table-sm">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Producto</th>
                        <th>Fecha Inicio</th>
                        <th>Fecha Fin</th>
                        <th>Estado</th>
                        <th>Notas</th>
                    </tr>
                </thead>
                <tbody>
                    ${warranties.map(w => `
                        <tr data-id="${w.id}">
                            <td>${w.id}</td>
                            <td>${w.product_name}</td>
                            <td>${w.start_date}</td>
                            <td>${w.end_date}</td>
                            <td><span class="badge bg-info">${w.status}</span></td>
                            <td>${w.notes}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        this.appView.innerHTML = table;
    },

    renderProviders(providers, userRole) {
        const actionsHeader = (userRole === 'admin') ? '<th>Acciones</th>' : '';
        const table = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h2>Proveedores</h2>
                ${userRole === 'admin' ? '<button id="add-provider-btn" class="btn btn-primary">Añadir Proveedor</button>' : ''}
            </div>
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
                <tbody>
                    ${providers.map(p => this.getProviderRow(p, userRole)).join('')}
                </tbody>
            </table>
        `;
        this.appView.innerHTML = table;
    },

    renderSales(sales, userRole) {
        const table = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h2>Ventas</h2>
                <button id="add-sale-btn" class="btn btn-primary">Registrar Venta</button>
            </div>
            <table class="table table-hover table-sm">
                <thead>
                    <tr>
                        <th>ID Venta</th>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Venta</th>
                        <th>Fecha Venta</th>
                        <th>Cliente</th>
                        <th>Notas</th>
                    </tr>
                </thead>
                <tbody>
                    ${sales.map(s => `
                        <tr data-id="${s.id}">
                            <td>${s.id}</td>
                            <td>${s.product_name}</td>
                            <td>${s.quantity}</td>
                            <td>$${parseFloat(s.sale_price).toFixed(2)}</td>
                            <td>${new Date(s.sale_date).toLocaleString()}</td>
                            <td>${s.customer_name || 'N/A'}</td>
                            <td>${s.notes || 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        this.appView.innerHTML = table;
    },

    renderReports(reportType, reportData) {
        let content = `<h2>Reportes</h2>`;
        content += `
            <div class="mb-3">
                <button class="btn btn-outline-primary me-2" id="show-inventory-report">Reporte de Inventario</button>
                <button class="btn btn-outline-primary" id="show-sales-report">Reporte de Ventas</button>
            </div>
            <hr>
        `;

        if (reportType === 'inventory' && reportData) {
            content += `
                <h3>Reporte de Inventario</h3>
                <p>Generado: ${new Date(reportData.generated_at).toLocaleString()}</p>
                <div class="card mb-4">
                    <div class="card-header">Valor Total del Inventario (Costo)</div>
                    <div class="card-body">
                        <h3 class="card-title">${reportData.total_inventory_value.toFixed(2)}</h3>
                    </div>
                </div>
                ${reportData.low_stock_items.length > 0 ? `
                <div class="card border-warning mb-4">
                    <div class="card-header bg-warning text-white">¡Notificación de Stock Bajo!</div>
                    <div class="card-body">
                        <p class="card-text">Los siguientes productos tienen un stock inferior a 50 unidades:</p>
                        <ul class="list-group list-group-flush">
                            ${reportData.low_stock_items.map(item => `<li class="list-group-item">${item.name} - <strong>Stock: ${item.stock}</strong></li>`).join('')}
                        </ul>
                    </div>
                </div>
                ` : `
                <div class="alert alert-success" role="alert">
                    ¡Buen trabajo! No hay productos con stock bajo (menos de 50 unidades).
                </div>
                `}
            `;
        } else if (reportType === 'sales' && reportData) {
            content += `
                <h3>Reporte de Ventas</h3>
                <p>Generado: ${new Date().toLocaleString()}</p>
                <div class="card mb-4">
                    <div class="card-header">Valor Total de Ventas</div>
                    <div class="card-body">
                        <h3 class="card-title">${reportData.total_sold.toFixed(2)}</h3>
                    </div>
                </div>
                <table class="table table-hover table-sm">
                    <thead>
                        <tr>
                            <th>ID Venta</th>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio Venta</th>
                            <th>Fecha Venta</th>
                            <th>Cliente</th>
                            <th>Notas</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reportData.sales.map(s => `
                            <tr data-id="${s.id}">
                                <td>${s.id}</td>
                                <td>${s.product_name}</td>
                                <td>${s.quantity}</td>
                                <td>${parseFloat(s.sale_price).toFixed(2)}</td>
                                <td>${new Date(s.sale_date).toLocaleString()}</td>
                                <td>${s.customer_name || 'N/A'}</td>
                                <td>${s.notes || 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            content += `<p>Selecciona un tipo de reporte para visualizar.</p>`;
        }
        this.appView.innerHTML = content;
    },

    // --- Render Formularios en Modales ---
    showProductForm(product = {}, providers = []) {
        const isEdit = !!product.id;
        this.modalTitle.textContent = isEdit ? 'Editar Producto' : 'Añadir Producto';
        this.modalBody.innerHTML = `
            <form id="product-form" data-id="${product.id || ''}">
                <div class="mb-3">
                    <label for="name" class="form-label">Nombre</label>
                    <input type="text" class="form-control" id="name" value="${product.name || ''}" required>
                </div>
                <div class="mb-3">
                    <label for="description" class="form-label">Descripción</label>
                    <textarea class="form-control" id="description" rows="3">${product.description || ''}</textarea>
                </div>
                <div class="mb-3">
                    <label for="stock" class="form-label">Stock</label>
                    <input type="number" class="form-control" id="stock" value="${product.stock || 0}" required>
                </div>
                <div class="mb-3">
                    <label for="condition" class="form-label">Condición</label>
                    <select class="form-select" id="condition" required>
                        <option value="nuevo" ${product.condition === 'nuevo' ? 'selected' : ''}>Nuevo</option>
                        <option value="usado" ${product.condition === 'usado' ? 'selected' : ''}>Usado</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label for="cost" class="form-label">Costo</label>
                    <input type="number" step="0.01" class="form-control" id="cost" value="${product.cost || 0}" required>
                </div>
                <div class="mb-3">
                    <label for="price_client" class="form-label">Precio Cliente</label>
                    <input type="number" step="0.01" class="form-control" id="price_client" value="${product.price_client || 0}" required>
                </div>
                <div class="mb-3">
                    <label for="price_wholesale" class="form-label">Precio Mayorista</label>
                    <input type="number" step="0.01" class="form-control" id="price_wholesale" value="${product.price_wholesale || 0}" required>
                </div>
                <div class="mb-3">
                    <label for="price_technician" class="form-label">Precio Técnico</label>
                    <input type="number" step="0.01" class="form-control" id="price_technician" value="${product.price_technician || 0}" required>
                </div>
                <div class="mb-3">
                    <label for="provider_id" class="form-label">Proveedor</label>
                    <select class="form-select" id="provider_id">
                        <option value="">-- Anónimo --</option>
                        ${providers.map(p => `<option value="${p.id}" ${product.provider_id == p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
                    </select>
                </div>
                <div class="mb-3">
                    <label for="entry_date" class="form-label">Fecha de Entrada</label>
                    <input type="date" class="form-control" id="entry_date" value="${product.entry_date || ''}">
                </div>
                <div class="mb-3">
                    <label for="warranty_expires_on" class="form-label">Garantía Expira</label>
                    <input type="date" class="form-control" id="warranty_expires_on" value="${product.warranty_expires_on || ''}">
                </div>
                <div class="d-grid">
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Actualizar' : 'Guardar'}</button>
                </div>
            </form>
        `;
        this.modal.show();
    },
    
    showWarrantyForm(products, warranty = {}) {
        const isEdit = !!warranty.id;
        this.modalTitle.textContent = isEdit ? 'Editar Garantía' : 'Registrar Garantía';
        this.modalBody.innerHTML = `
            <form id="warranty-form" data-id="${warranty.id || ''}">
                <div class="mb-3">
                    <label for="product_id" class="form-label">Producto</label>
                    <select class="form-select" id="product_id" required>
                        <option value="">Seleccione un producto...</option>
                        ${products.map(p => `<option value="${p.id}" ${warranty.product_id == p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
                    </select>
                </div>
                <div class="mb-3">
                    <label for="start_date" class="form-label">Fecha de Inicio</label>
                    <input type="date" class="form-control" id="start_date" value="${warranty.start_date || ''}" required>
                </div>
                <div class="mb-3">
                    <label for="end_date" class="form-label">Fecha de Fin</label>
                    <input type="date" class="form-control" id="end_date" value="${warranty.end_date || ''}" required>
                </div>
                <div class="mb-3">
                    <label for="notes" class="form-label">Notas</label>
                    <textarea class="form-control" id="notes" rows="3">${warranty.notes || ''}</textarea>
                </div>
                <div class="d-grid">
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Actualizar' : 'Guardar'}</button>
                </div>
            </form>
        `;
        this.modal.show();
    },

    showProviderForm(provider = {}) {
        const isEdit = !!provider.id;
        this.modalTitle.textContent = isEdit ? 'Editar Proveedor' : 'Añadir Proveedor';
        this.modalBody.innerHTML = `
            <form id="provider-form" data-id="${provider.id || ''}">
                <div class="mb-3">
                    <label for="name" class="form-label">Nombre</label>
                    <input type="text" class="form-control" id="name" value="${provider.name || ''}" required>
                </div>
                <div class="mb-3">
                    <label for="contact_person" class="form-label">Persona de Contacto</label>
                    <input type="text" class="form-control" id="contact_person" value="${provider.contact_person || ''}">
                </div>
                <div class="mb-3">
                    <label for="phone" class="form-label">Teléfono</label>
                    <input type="text" class="form-control" id="phone" value="${provider.phone || ''}">
                </div>
                <div class="mb-3">
                    <label for="email" class="form-label">Email</label>
                    <input type="email" class="form-control" id="email" value="${provider.email || ''}">
                </div>
                <div class="d-grid">
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Actualizar' : 'Guardar'}</button>
                </div>
            </form>
        `;
        this.modal.show();
    },

    showSaleForm(products) {
        this.modalTitle.textContent = 'Registrar Venta';
        this.modalBody.innerHTML = `
            <form id="sale-form">
                <div class="mb-3">
                    <label for="product_id" class="form-label">Producto</label>
                    <select class="form-select" id="product_id" required>
                        <option value="">Seleccione un producto...</option>
                        ${products.map(p => `<option value="${p.id}" data-price="${p.price}">${p.name} ($${parseFloat(p.price).toFixed(2)})</option>`).join('')}
                    </select>
                </div>
                <div class="mb-3">
                    <label for="quantity" class="form-label">Cantidad</label>
                    <input type="number" class="form-control" id="quantity" value="1" min="1" required>
                </div>
                <div class="mb-3">
                    <label for="sale_price" class="form-label">Precio de Venta</label>
                    <input type="number" step="0.01" class="form-control" id="sale_price" required>
                </div>
                <div class="mb-3">
                    <label for="customer_name" class="form-label">Nombre del Cliente (Opcional)</label>
                    <input type="text" class="form-control" id="customer_name">
                </div>
                <div class="mb-3">
                    <label for="notes" class="form-label">Notas (Opcional)</label>
                    <textarea class="form-control" id="notes" rows="3"></textarea>
                </div>
                <div class="d-grid">
                    <button type="submit" class="btn btn-primary">Registrar Venta</button>
                </div>
            </form>
        `;
        this.modal.show();

        // Auto-fill sale_price based on selected product
        document.getElementById('product_id').addEventListener('change', (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            const price = selectedOption.dataset.price;
            if (price) {
                document.getElementById('sale_price').value = parseFloat(price).toFixed(2);
            }
        });
    },

    // --- Helpers ---
    getProductRow(product, userRole) {
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
    },

    getProviderRow(provider, userRole) {
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
    },

    hideModal() {
        this.modal.hide();
    },

    showAlert(message, type = 'success') {
        const alertPlaceholder = document.createElement('div');
        alertPlaceholder.innerHTML = `<div class="alert alert-${type} alert-dismissible" role="alert">${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
        this.appView.prepend(alertPlaceholder);
        setTimeout(() => {
            const alert = bootstrap.Alert.getOrCreateInstance(alertPlaceholder.firstChild);
            if (alert) alert.close();
        }, 4000);
    }
};