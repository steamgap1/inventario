import { api } from '../api.js';
import * as ui from '../ui.js';

async function generatePdf(e) {
    const btn = e.target;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generando PDF...';

    const reportType = document.getElementById('report-type-select').value;

    try {
        const blob = await api.generatePdfReport(reportType);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `reporte_${reportType}_${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    } catch (error) {
        ui.showAlert(`Error al generar el PDF: ${error.message}`, 'danger', 0);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function viewReportInScreen(e) {
    const btn = e.target;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Cargando...';

    const reportType = document.getElementById('report-type-select').value;

    try {
        const result = await api.getReportData(reportType);
        ui.renderReportDataInView(result.data.title, result.data);
    } catch (error) {
        ui.showAlert(`Error al cargar el reporte: ${error.message}`, 'danger', 0);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

export function handleReportClick(e) {
    if (e.target.id === 'generate-pdf-btn') {
        generatePdf(e);
    } else if (e.target.id === 'view-report-btn') {
        viewReportInScreen(e);
    }
}

export function init() {
    ui.renderReports(); // Dibuja la UI inicial de la sección de reportes
}
