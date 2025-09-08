<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use PDO;
use Dompdf\Dompdf;
use Dompdf\Options;

class ReportController
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getInventoryReport(Request $request, Response $response): Response
    {
        $lowStock = $this->pdo->query("SELECT id, name, stock FROM products WHERE stock < 50 AND is_active = 1")->fetchAll();
        $totalValueStmt = $this->pdo->query("SELECT SUM(stock * cost) as total_value FROM products WHERE is_active = 1");
        $totalValue = $totalValueStmt->fetchColumn();
        $report = [
            'low_stock_items' => $lowStock,
            'total_inventory_value' => (float)$totalValue,
            'generated_at' => date(\DateTime::ISO8601)
        ];
        $response->getBody()->write(json_encode(['status' => 'success', 'data' => $report]));
        return $response;
    }

    public function getSalesReport(Request $request, Response $response): Response
    {
        // Get the list of sales
        $sql = "SELECT s.*, p.name as product_name FROM sales s JOIN products p ON s.product_id = p.id ORDER BY s.sale_date DESC";
        $stmt = $this->pdo->query($sql);
        $sales = $stmt->fetchAll();

        // Calculate the total amount sold
        $totalSoldStmt = $this->pdo->query("SELECT SUM(quantity * sale_price) as total_sold FROM sales");
        $totalSold = $totalSoldStmt->fetchColumn();

        $report = [
            'sales' => $sales,
            'total_sold' => (float)$totalSold,
        ];

        $response->getBody()->write(json_encode(['status' => 'success', 'data' => $report]));
        return $response;
    }

    public function getReportData(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $type = $params['type'] ?? '';

        try {
            $reportData = $this->fetchReportData($type);
            $response->getBody()->write(json_encode(['status' => 'success', 'data' => $reportData]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['status' => 'error', 'message' => 'Error al generar el reporte: ' . $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function generatePdfReport(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $type = $params['type'] ?? '';

        try {
            $reportData = $this->fetchReportData($type);
        } catch (\InvalidArgumentException $e) {
            $response->getBody()->write(json_encode(['status' => 'error', 'message' => $e->getMessage()]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $html = $this->generateHtmlForPdf($reportData['title'], $reportData['headers'], $reportData['data'], $reportData['summary']);

        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', true);
        $dompdf = new Dompdf($options);

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        $pdfOutput = $dompdf->output();
        $response->getBody()->write($pdfOutput);

        return $response
            ->withHeader('Content-Type', 'application/pdf')
            ->withHeader('Content-Disposition', 'attachment; filename="' . $type . '_report.pdf"');
    }

    private function fetchReportData(string $type): array
    {
        $title = '';
        $headers = [];
        $data = [];
        $summary = [];

        switch ($type) {
            case 'products':
                $title = 'Reporte de Productos';
                $headers = ['ID', 'Nombre', 'Stock', 'Condición', 'Costo', 'P. Cliente'];
                $data = $this->pdo->query("SELECT id, name, stock, `condition`, cost, price_client FROM products")->fetchAll(PDO::FETCH_ASSOC);
                $totalValue = $this->pdo->query("SELECT SUM(stock * cost) FROM products")->fetchColumn();
                $summary = [
                    ['label' => 'Total de Productos', 'value' => count($data)],
                    ['label' => 'Valor Total del Inventario (Costo)', 'value' => number_format((float)$totalValue, 2) . ' COP']
                ];
                break;
            case 'providers':
                $title = 'Reporte de Proveedores';
                $headers = ['ID', 'Nombre', 'Contacto', 'Teléfono', 'Email'];
                $data = $this->pdo->query("SELECT id, name, contact_person, phone, email FROM providers")->fetchAll(PDO::FETCH_ASSOC);
                $summary = [
                    ['label' => 'Total de Proveedores', 'value' => count($data)]
                ];
                break;
            case 'sales':
                $title = 'Reporte de Ventas';
                $headers = ['ID', 'Producto', 'Cantidad', 'Precio Venta', 'Fecha', 'Cliente'];
                $data = $this->pdo->query("SELECT s.id, p.name as product_name, s.quantity, s.sale_price, s.sale_date, c.name as customer_name FROM sales s JOIN products p ON s.product_id = p.id LEFT JOIN customers c ON s.customer_id = c.id")->fetchAll(PDO::FETCH_ASSOC);
                $totalSold = $this->pdo->query("SELECT SUM(quantity * sale_price) FROM sales")->fetchColumn();
                $summary = [
                    ['label' => 'Total de Ventas', 'value' => count($data)],
                    ['label' => 'Ingresos Totales por Ventas', 'value' => number_format((float)$totalSold, 2) . ' COP']
                ];
                break;
            case 'warranties':
                $title = 'Reporte de Garantías';
                $headers = ['ID', 'Producto', 'Fecha Inicio', 'Fecha Fin', 'Estado'];
                $data = $this->pdo->query("SELECT w.id, p.name as product_name, w.start_date, w.end_date, w.status FROM warranties w JOIN products p ON w.product_id = p.id")->fetchAll(PDO::FETCH_ASSOC);
                $activeCount = $this->pdo->query("SELECT COUNT(*) FROM warranties WHERE status = 'activa'")->fetchColumn();
                $expiredCount = $this->pdo->query("SELECT COUNT(*) FROM warranties WHERE status = 'expirada'")->fetchColumn();
                $summary = [
                    ['label' => 'Total de Garantías', 'value' => count($data)],
                    ['label' => 'Garantías Activas', 'value' => $activeCount],
                    ['label' => 'Garantías Expiradas', 'value' => $expiredCount]
                ];
                break;
            case 'low_stock':
                $title = 'Reporte de Productos con Bajo Stock';
                $headers = ['ID', 'Nombre', 'Stock'];
                $data = $this->pdo->query("SELECT id, name, stock FROM products WHERE stock < 50 AND is_active = 1")->fetchAll(PDO::FETCH_ASSOC);
                $summary = [
                    ['label' => 'Total de Productos con Bajo Stock', 'value' => count($data)]
                ];
                break;
            default:
                throw new \InvalidArgumentException('Tipo de reporte no válido.');
        }

        return ['title' => $title, 'headers' => $headers, 'data' => $data, 'summary' => $summary];
    }

    private function generateHtmlForPdf(string $title, array $headers, array $data, array $summary): string
    {
        $headerHtml = '';
        foreach ($headers as $header) {
            $headerHtml .= "<th>{$header}</th>";
        }

        $rowsHtml = '';
        if (empty($data)) {
            $rowsHtml = '<tr><td colspan="' . count($headers) . '">No hay datos disponibles.</td></tr>';
        } else {
            foreach ($data as $row) {
                $rowsHtml .= '<tr>';
                foreach ($row as $cell) {
                    $rowsHtml .= '<td>' . htmlspecialchars($cell, ENT_QUOTES, 'UTF-8') . '</td>';
                }
                $rowsHtml .= '</tr>';
            }
        }

        $summaryHtml = '';
        if (!empty($summary)) {
            $summaryHtml .= '<div class="summary">';
            foreach ($summary as $item) {
                $summaryHtml .= '<div class="summary-item"><strong>' . htmlspecialchars($item['label'], ENT_QUOTES, 'UTF-8') . ':</strong> ' . htmlspecialchars($item['value'], ENT_QUOTES, 'UTF-8') . '</div>';
            }
            $summaryHtml .= '</div>';
        }

        $generationDate = date('d/m/Y H:i:s');

        return <<<HTML
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>{$title}</title>
            <style>
                body { font-family: sans-serif; margin: 20px; }
                h1 { text-align: center; margin-bottom: 20px; }
                .summary { border: 1px solid #ccc; background-color: #f9f9f9; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
                .summary-item { font-size: 14px; margin-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th, td { border: 1px solid #dddddd; text-align: left; padding: 8px; }
                thead tr { background-color: #f2f2f2; }
                tbody tr:nth-child(even) { background-color: #fafafa; }
                .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #777; }
            </style>
        </head>
        <body>
            <h1>{$title}</h1>
            <p>Generado el: {$generationDate}</p>
            {$summaryHtml}
            <table>
                <thead>
                    <tr>{$headerHtml}</tr>
                </thead>
                <tbody>
                    {$rowsHtml}
                </tbody>
            </table>
            <div class="footer">Reporte generado por StockMaster</div>
        </body>
        </html>
HTML;
    }
}
