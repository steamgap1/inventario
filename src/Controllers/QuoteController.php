<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use PDO;
use Dompdf\Dompdf;
use Dompdf\Options;

class QuoteController
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getAll(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();

        $page = (int)($params['page'] ?? 1);
        $limit = (int)($params['limit'] ?? 10);
        $offset = ($page - 1) * $limit;

        $baseSql = "FROM quotes q LEFT JOIN customers c ON q.customer_id = c.id";
        $countSql = "SELECT COUNT(q.id) ";
        $selectSql = "SELECT q.*, c.name as customer_name ";

        $where = [];
        $bindings = [];

        if (!empty($params['search'])) {
            $where[] = "(c.name LIKE ? OR q.notes LIKE ?)";
            $bindings[] = '%' . $params['search'] . '%';
            $bindings[] = '%' . $params['search'] . '%';
        }

        $whereSql = '';
        if (count($where) > 0) {
            $whereSql = " WHERE " . implode(' AND ', $where);
        }

        // Get total count for pagination
        $countStmt = $this->pdo->prepare($countSql . $baseSql . $whereSql);
        $countStmt->execute($bindings);
        $totalRecords = $countStmt->fetchColumn();

        $orderSql = " ORDER BY q.quote_date DESC"; // Default sort by most recent

        // Get records for the current page
        $sql = $selectSql . $baseSql . $whereSql . $orderSql . " LIMIT ? OFFSET ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(array_merge($bindings, [$limit, $offset]));
        
        $quotes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $response->getBody()->write(json_encode([
            'status' => 'success', 
            'data' => $quotes,
            'pagination' => [
                'total' => $totalRecords,
                'page' => $page,
                'limit' => $limit,
                'totalPages' => ceil($totalRecords / $limit)
            ]
        ]));
        return $response;
    }

    public function getOne(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'];
        $stmt = $this->pdo->prepare("SELECT q.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone FROM quotes q LEFT JOIN customers c ON q.customer_id = c.id WHERE q.id = ?");
        $stmt->execute([$id]);
        $quote = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$quote) {
            $response->getBody()->write(json_encode(['status' => 'error', 'message' => 'Cotización no encontrada.']));
            return $response->withStatus(404);
        }

        $stmtItems = $this->pdo->prepare("SELECT qi.*, p.name as product_name FROM quote_items qi JOIN products p ON qi.product_id = p.id WHERE qi.quote_id = ?");
        $stmtItems->execute([$id]);
        $quote['items'] = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

        $response->getBody()->write(json_encode(['status' => 'success', 'data' => $quote]));
        return $response;
    }

    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare(
                "INSERT INTO quotes (customer_id, valid_until, total_amount, notes, status) 
                VALUES (?, ?, ?, ?, ?)"
            );
            $stmt->execute([
                $data['customer_id'],
                $data['valid_until'] ?? null,
                $data['total_amount'] ?? 0.00,
                $data['notes'] ?? null,
                $data['status'] ?? 'draft'
            ]);
            $quoteId = $this->pdo->lastInsertId();

            if (isset($data['items']) && is_array($data['items'])) {
                $itemStmt = $this->pdo->prepare(
                    "INSERT INTO quote_items (quote_id, product_id, quantity, unit_price, item_total, notes) 
                    VALUES (?, ?, ?, ?, ?, ?)"
                );
                foreach ($data['items'] as $item) {
                    $itemStmt->execute([
                        $quoteId,
                        $item['product_id'],
                        $item['quantity'],
                        $item['unit_price'],
                        $item['item_total'],
                        $item['notes'] ?? null
                    ]);
                }
            }

            $this->pdo->commit();
            $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Cotización creada con éxito.', 'id' => $quoteId]));
            return $response->withStatus(201);
        } catch (\Exception $e) {
            $this->pdo->rollBack();
            $response->getBody()->write(json_encode(['status' => 'error', 'message' => 'Error al crear la cotización: ' . $e->getMessage()]));
            return $response->withStatus(500);
        }
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'];
        $data = $request->getParsedBody();

        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare(
                "UPDATE quotes SET customer_id=?, valid_until=?, total_amount=?, notes=?, status=? 
                WHERE id = ?"
            );
            $stmt->execute([
                $data['customer_id'],
                $data['valid_until'] ?? null,
                $data['total_amount'] ?? 0.00,
                $data['notes'] ?? null,
                $data['status'] ?? 'draft',
                $id
            ]);

            // Delete existing items and insert new ones
            $deleteItemsStmt = $this->pdo->prepare("DELETE FROM quote_items WHERE quote_id = ?");
            $deleteItemsStmt->execute([$id]);

            if (isset($data['items']) && is_array($data['items'])) {
                $itemStmt = $this->pdo->prepare(
                    "INSERT INTO quote_items (quote_id, product_id, quantity, unit_price, item_total, notes) 
                    VALUES (?, ?, ?, ?, ?, ?)"
                );
                foreach ($data['items'] as $item) {
                    $itemStmt->execute([
                        $id,
                        $item['product_id'],
                        $item['quantity'],
                        $item['unit_price'],
                        $item['item_total'],
                        $item['notes'] ?? null
                    ]);
                }
            }

            $this->pdo->commit();
            $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Cotización actualizada con éxito.']));
            return $response;
        } catch (\Exception $e) {
            $this->pdo->rollBack();
            $response->getBody()->write(json_encode(['status' => 'error', 'message' => 'Error al actualizar la cotización: ' . $e->getMessage()]));
            return $response->withStatus(500);
        }
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'];
        $this->pdo->beginTransaction();
        try {
            // Items are deleted automatically due to ON DELETE CASCADE on quote_id
            $stmt = $this->pdo->prepare("DELETE FROM quotes WHERE id = ?");
            $stmt->execute([$id]);
            $this->pdo->commit();
            $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Cotización eliminada con éxito.']));
            return $response;
        } catch (\Exception $e) {
            $this->pdo->rollBack();
            $response->getBody()->write(json_encode(['status' => 'error', 'message' => 'Error al eliminar la cotización: ' . $e->getMessage()]));
            return $response->withStatus(500);
        }
    }

    public function generatePdf(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'];
        $stmt = $this->pdo->prepare("SELECT q.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone FROM quotes q LEFT JOIN customers c ON q.customer_id = c.id WHERE q.id = ?");
        $stmt->execute([$id]);
        $quote = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$quote) {
            $response->getBody()->write(json_encode(['status' => 'error', 'message' => 'Cotización no encontrada.']));
            return $response->withStatus(404);
        }

        $stmtItems = $this->pdo->prepare("SELECT qi.*, p.name as product_name FROM quote_items qi JOIN products p ON qi.product_id = p.id WHERE qi.quote_id = ?");
        $stmtItems->execute([$id]);
        $quote['items'] = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

        $html = $this->generateHtmlForQuotePdf($quote);

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
            ->withHeader('Content-Disposition', 'attachment; filename="cotizacion_' . $id . '.pdf"');
    }

    private function generateHtmlForQuotePdf(array $quote): string
    {
        $itemsHtml = '';
        foreach ($quote['items'] as $item) {
            $itemsHtml .= '<tr>';
            $itemsHtml .= '<td>' . htmlspecialchars($item['product_name'], ENT_QUOTES, 'UTF-8') . '</td>';
            $itemsHtml .= '<td>' . htmlspecialchars($item['quantity'], ENT_QUOTES, 'UTF-8') . '</td>';
            $itemsHtml .= '<td>' . htmlspecialchars($item['unit_price'], ENT_QUOTES, 'UTF-8') . '</td>';
            $itemsHtml .= '<td>' . htmlspecialchars($item['item_total'], ENT_QUOTES, 'UTF-8') . '</td>';
            $itemsHtml .= '<td>' . htmlspecialchars($item['notes'], ENT_QUOTES, 'UTF-8') . '</td>';
            $itemsHtml .= '</tr>';
        }

        $totalAmount = number_format((float)$quote['total_amount'], 2);
        $quoteDate = date('d/m/Y', strtotime($quote['quote_date']));
        $validUntil = $quote['valid_until'] ? date('d/m/Y', strtotime($quote['valid_until'])) : 'N/A';

        return <<<HTML
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Cotización #{$quote['id']}</title>
            <style>
                body { font-family: sans-serif; margin: 20px; }
                h1 { text-align: center; margin-bottom: 20px; }
                .customer-details { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th, td { border: 1px solid #dddddd; text-align: left; padding: 8px; }
                thead tr { background-color: #f2f2f2; }
                tbody tr:nth-child(even) { background-color: #fafafa; }
                .total { text-align: right; margin-top: 20px; font-size: 16px; font-weight: bold; }
                .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #777; }
            </style>
        </head>
        <body>
            <h1>Cotización #{$quote['id']}</h1>
            <div class="customer-details">
                <div><strong>Cliente:</strong> {$quote['customer_name']}</div>
                <div><strong>Email:</strong> {$quote['customer_email']}</div>
                <div><strong>Teléfono:</strong> {$quote['customer_phone']}</div>
                <div><strong>Fecha de Cotización:</strong> {$quoteDate}</div>
                <div><strong>Válido Hasta:</strong> {$validUntil}</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Unitario</th>
                        <th>Total</th>
                        <th>Notas</th>
                    </tr>
                </thead>
                <tbody>
                    {$itemsHtml}
                </tbody>
            </table>
            <div class="total">
                Total: {$totalAmount} COP
            </div>
            <div class="footer">Reporte generado por StockMaster</div>
        </body>
        </html>
HTML;
    }
}