<?php

namespace App\Repositories;

use PDO;

class SaleRepository
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function create(array $data): array
    {
        try {
            $this->pdo->beginTransaction();

            $totalAmount = 0;
            foreach ($data['items'] as $item) {
                $totalAmount += $item['quantity'] * $item['unit_price'];
            }

            $sql = "INSERT INTO sales (customer_id, notes, total_amount) VALUES (?, ?, ?)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $data['customer_id'],
                $data['notes'],
                $totalAmount
            ]);
            $saleId = $this->pdo->lastInsertId();

            foreach ($data['items'] as $item) {
                $itemSql = "INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, item_total) VALUES (?, ?, ?, ?, ?)";
                $itemStmt = $this->pdo->prepare($itemSql);
                $itemStmt->execute([
                    $saleId,
                    $item['product_id'],
                    $item['quantity'],
                    $item['unit_price'],
                    $item['quantity'] * $item['unit_price']
                ]);

                // Update product stock
                $updateStockSql = "UPDATE products SET stock = stock - ? WHERE id = ?";
                $updateStockStmt = $this->pdo->prepare($updateStockSql);
                $updateStockStmt->execute([$item['quantity'], $item['product_id']]);
            }

            $this->pdo->commit();
            return $this->findById($saleId);
        } catch (\PDOException $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function getAll(int $limit, int $offset, array $filters): array
    {
        $baseSql = "FROM sales s LEFT JOIN customers c ON s.customer_id = c.id";
        $countSql = "SELECT COUNT(s.id) ";
        $selectSql = "SELECT s.*, c.name as customer_name ";

        $where = [];
        $bindings = [];

        if (!empty($filters['search'])) {
            $searchTerm = '%' . $filters['search'] . '%';
            $where[] = "(c.name LIKE ? OR EXISTS (SELECT 1 FROM sale_items si JOIN products p ON si.product_id = p.id WHERE si.sale_id = s.id AND p.name LIKE ?))";
            $bindings[] = $searchTerm;
            $bindings[] = $searchTerm;
        }

        $whereSql = '';
        if (count($where) > 0) {
            $whereSql = " WHERE " . implode(' AND ', $where);
        }

        // Get total count for pagination
        $countStmt = $this->pdo->prepare($countSql . $baseSql . $whereSql);
        $countStmt->execute($bindings);
        $totalRecords = $countStmt->fetchColumn();

        $orderSql = " ORDER BY s.sale_date DESC"; // Default sort by most recent

        // Get records for the current page
        $sql = $selectSql . $baseSql . $whereSql . $orderSql . " LIMIT ? OFFSET ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(array_merge($bindings, [$limit, $offset]));
        
        $sales = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($sales as &$sale) {
            $itemsSql = "
                SELECT
                    si.*,
                    p.name AS product_name
                FROM
                    sale_items si
                LEFT JOIN
                    products p ON si.product_id = p.id
                WHERE
                    si.sale_id = ?
            ";
            $itemsStmt = $this->pdo->prepare($itemsSql);
            $itemsStmt->execute([$sale['id']]);
            $sale['items'] = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);
        }

        return [
            'data' => $sales,
            'total' => $totalRecords
        ];
    }

    public function findById(int $id): ?array
    {
        $sql = "
            SELECT
                s.*,
                c.name AS customer_name
            FROM
                sales s
            LEFT JOIN
                customers c ON s.customer_id = c.id
            WHERE
                s.id = ?
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id]);
        $sale = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$sale) {
            return null;
        }

        $itemsSql = "
            SELECT
                si.*,
                p.name AS product_name
            FROM
                sale_items si
            LEFT JOIN
                products p ON si.product_id = p.id
            WHERE
                si.sale_id = ?
        ";
        $itemsStmt = $this->pdo->prepare($itemsSql);
        $itemsStmt->execute([$id]);
        $sale['items'] = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

        return $sale;
    }

    public function update(int $id, array $data): bool
    {
        try {
            $this->pdo->beginTransaction();

            // Restore stock for the original items
            $originalSale = $this->findById($id);
            foreach ($originalSale['items'] as $item) {
                $updateStockSql = "UPDATE products SET stock = stock + ? WHERE id = ?";
                $updateStockStmt = $this->pdo->prepare($updateStockSql);
                $updateStockStmt->execute([$item['quantity'], $item['product_id']]);
            }

            // Delete existing items
            $deleteItemsSql = "DELETE FROM sale_items WHERE sale_id = ?";
            $deleteStmt = $this->pdo->prepare($deleteItemsSql);
            $deleteStmt->execute([$id]);

            $totalAmount = 0;
            foreach ($data['items'] as $item) {
                $totalAmount += $item['quantity'] * $item['unit_price'];
            }

            $sql = "UPDATE sales SET customer_id = ?, notes = ?, total_amount = ? WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $data['customer_id'],
                $data['notes'],
                $totalAmount,
                $id
            ]);

            foreach ($data['items'] as $item) {
                $itemSql = "INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, item_total) VALUES (?, ?, ?, ?, ?)";
                $itemStmt = $this->pdo->prepare($itemSql);
                $itemStmt->execute([
                    $id,
                    $item['product_id'],
                    $item['quantity'],
                    $item['unit_price'],
                    $item['quantity'] * $item['unit_price']
                ]);

                // Update product stock
                $updateStockSql = "UPDATE products SET stock = stock - ? WHERE id = ?";
                $updateStockStmt = $this->pdo->prepare($updateStockSql);
                $updateStockStmt->execute([$item['quantity'], $item['product_id']]);
            }

            $this->pdo->commit();
            return true;
        } catch (\PDOException $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function delete(int $id): bool
    {
        try {
            $this->pdo->beginTransaction();

            // Restore stock for the original items
            $originalSale = $this->findById($id);
            foreach ($originalSale['items'] as $item) {
                $updateStockSql = "UPDATE products SET stock = stock + ? WHERE id = ?";
                $updateStockStmt = $this->pdo->prepare($updateStockSql);
                $updateStockStmt->execute([$item['quantity'], $item['product_id']]);
            }

            $sql = "DELETE FROM sales WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$id]);

            $this->pdo->commit();
            return $stmt->rowCount() > 0;
        } catch (\PDOException $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
}
