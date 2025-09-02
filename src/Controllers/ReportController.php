<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use PDO;

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
        $sql = "SELECT s.*, p.name as product_name FROM sales s JOIN products p ON s.product_id = p.id ORDER BY s.sale_date DESC";
        $stmt = $this->pdo->query($sql);
        $sales = $stmt->fetchAll();
        $response->getBody()->write(json_encode(['status' => 'success', 'data' => $sales]));
        return $response;
    }
}
