<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use PDO;

class SaleController
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        $productId = $data['product_id'];
        $quantity = $data['quantity'];
        $salePrice = $data['sale_price'];
        $customerName = $data['customer_name'] ?? null;
        $notes = $data['notes'] ?? null;

        try {
            $this->pdo->beginTransaction();

            // 1. Check current stock
            $stmt = $this->pdo->prepare("SELECT stock FROM products WHERE id = ? FOR UPDATE");
            $stmt->execute([$productId]);
            $currentStock = $stmt->fetchColumn();

            if ($currentStock === false || $currentStock < $quantity) {
                $this->pdo->rollBack();
                $response->getBody()->write(json_encode(['status' => 'error', 'message' => 'Stock insuficiente o producto no encontrado.']));
                return $response->withStatus(400);
            }

            // 2. Insert the sale
            $stmt = $this->pdo->prepare("INSERT INTO sales (product_id, quantity, sale_price, customer_name, notes) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$productId, $quantity, $salePrice, $customerName, $notes]);

            // 3. Update product stock
            $newStock = $currentStock - $quantity;
            $stmt = $this->pdo->prepare("UPDATE products SET stock = ? WHERE id = ?");
            $stmt->execute([$newStock, $productId]);

            $this->pdo->commit();
            $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Venta registrada y stock actualizado.']));
            return $response->withStatus(201);

        } catch (\PDOException $e) {
            $this->pdo->rollBack();
            $response->getBody()->write(json_encode(['status' => 'error', 'message' => 'Error al registrar la venta: ' . $e->getMessage()]));
            return $response->withStatus(500);
        }
    }

    public function getAll(Request $request, Response $response): Response
    {
        $sql = "SELECT s.*, p.name as product_name FROM sales s JOIN products p ON s.product_id = p.id ORDER BY s.sale_date DESC";
        $stmt = $this->pdo->query($sql);
        $sales = $stmt->fetchAll();
        $response->getBody()->write(json_encode(['status' => 'success', 'data' => $sales]));
        return $response;
    }
}
