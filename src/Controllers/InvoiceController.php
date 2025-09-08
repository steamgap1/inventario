<?php

namespace App\Controllers;

use App\Services\InvoiceService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use InvalidArgumentException;
use Dompdf\Dompdf;
use Dompdf\Options;

class InvoiceController
{
    private $invoiceService;

    public function __construct(InvoiceService $invoiceService)
    {
        $this->invoiceService = $invoiceService;
    }

    public function generateInvoice(Request $request, Response $response, array $args): Response
    {
        try {
            $saleId = (int)$args['sale_id'];
            $invoice = $this->invoiceService->generateInvoiceFromSale($saleId);
            $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Factura generada con éxito.', 'data' => $invoice]));
            return $response->withStatus(201);
        } catch (\Throwable $e) {
            $response->getBody()->write(json_encode(['status' => 'error', 'message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]));
            return $response->withStatus(500);
        }
    }

    public function getInvoice(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        $invoice = $this->invoiceService->getInvoice($id);

        if (!$invoice) {
            $response->getBody()->write(json_encode(['status' => 'error', 'message' => 'Factura no encontrada.']));
            return $response->withStatus(404);
        }

        $response->getBody()->write(json_encode(['status' => 'success', 'data' => $invoice]));
        return $response;
    }

    public function updateInvoice(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        $data = $request->getParsedBody();

        try {
            $this->invoiceService->updateInvoice($id, $data);
            $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Factura actualizada con éxito.']));
            return $response;
        } catch (InvalidArgumentException $e) {
            $response->getBody()->write(json_encode(['status' => 'error', 'message' => $e->getMessage()]));
            return $response->withStatus(400);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['status' => 'error', 'message' => 'Error al actualizar la factura: ' . $e->getMessage()]));
            return $response->withStatus(500);
        }
    }

    public function deleteInvoice(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        try {
            $this->invoiceService->deleteInvoice($id);
            $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Factura eliminada con éxito.']));
            return $response;
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['status' => 'error', 'message' => 'Error al eliminar la factura: ' . $e->getMessage()]));
            return $response->withStatus(500);
        }
    }

    public function previewInvoicePdf(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        $invoice = $this->invoiceService->getInvoice($id);

        if (!$invoice) {
            return $response->withStatus(404)->getBody()->write('Factura no encontrada.');
        }

        // Generate HTML for the invoice
        $html = $this->generateInvoiceHtml($invoice);

        // Instantiate Dompdf with options
        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', true); // Enable loading remote assets if needed
        $dompdf = new Dompdf($options);

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        // Output the generated PDF to the browser
        $response->getBody()->write($dompdf->output());
        return $response->withHeader('Content-Type', 'application/pdf');
    }

    public function getAllInvoices(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $page = (int)($params['page'] ?? 1);
        $limit = (int)($params['limit'] ?? 10);
        $filters = [
            'search' => $params['search'] ?? null
        ];

        $result = $this->invoiceService->getAllInvoices($page, $limit, $filters);

        $response->getBody()->write(json_encode(['status' => 'success', 'data' => $result['data'], 'pagination' => $result['pagination']]));
        return $response;
    }

    private function generateInvoiceHtml(array $invoice): string
    {
        // Basic HTML template for the invoice
        $html = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Factura #' . $invoice['id'] . '</title>
            <style>
                body { font-family: sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .invoice-details, .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                .invoice-details td, .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; }
                .items-table th { background-color: #f2f2f2; }
                .total { text-align: right; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Factura</h1>
                <p><strong>Factura ID:</strong> ' . $invoice['id'] . '</p>
                <p><strong>Fecha:</strong> ' . $invoice['invoice_date'] . '</p>
            </div>

            <table class="invoice-details">
                <tr>
                    <td><strong>Venta ID:</strong> ' . $invoice['sale_id'] . '</td>
                    <td><strong>Cliente:</strong> ' . ($invoice['customer_name'] ?? 'N/A') . '</td>
                </tr>
            </table>

            <table class="items-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Unitario</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>';
        
        foreach ($invoice['items'] as $item) {
            $html .= '
                    <tr>
                        <td>' . $item['product_name'] . '</td>
                        <td>' . $item['quantity'] . '</td>
                        <td>' . number_format($item['unit_price'], 2) . '</td>
                        <td>' . number_format($item['item_total'], 2) . '</td>
                    </tr>';
        }

        $html .= '
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" class="total">Monto Total:</td>
                        <td class="total">' . number_format($invoice['total_amount'], 2) . '</td>
                    </tr>
                </tfoot>
            </table>

            <p>Estado: ' . $invoice['status'] . '</p>
        </body>
        </html>';

        return $html;
    }
}