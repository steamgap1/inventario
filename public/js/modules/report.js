import { api } from '../api.js';
import * as ui from '../ui.js';

async function loadReports(reportType = 'inventory') {
    try {
        let reportData;
        if (reportType === 'inventory') {
            reportData = await api.getInventoryReport();
            ui.renderReports('inventory', reportData.data);
        } else if (reportType === 'sales') {
            reportData = await api.getSalesReport();
            ui.renderReports('sales', reportData.data);
        }
    } catch (error) {
        ui.showAlert('Error al cargar el reporte: ' + error.message, 'danger');
    }
}

export function init() {
    ui.renderReports(); // Renderiza la interfaz de selección de reportes
}

export function handleReportClick(e) {
    if (e.target.id === 'show-inventory-report') { // Nuevo: Botón reporte inventario
        loadReports('inventory');
    } else if (e.target.id === 'show-sales-report') { // Nuevo: Botón reporte ventas
        loadReports('sales');
    }
}