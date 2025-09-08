<?php

namespace App\Repositories;

use PDO;

class InvoiceRepository
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function create(array $invoiceData, array $itemsData): int
    {
        $this->pdo->beginTransaction();
        try {
            // Insert into invoices table
            $sql = "INSERT INTO invoices (sale_id, customer_id, invoice_date, total_amount, status) VALUES (?, ?, ?, ?, ?)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $invoiceData['sale_id'],
                $invoiceData['customer_id'],
                $invoiceData['invoice_date'],
                $invoiceData['total_amount'],
                $invoiceData['status'] ?? 'unpaid'
            ]);
            $invoiceId = $this->pdo->lastInsertId();

            // Insert into invoice_items table
            foreach ($itemsData as $item) {
                $itemSql = "INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, item_total) VALUES (?, ?, ?, ?, ?)";
                $itemStmt = $this->pdo->prepare($itemSql);
                $itemStmt->execute([
                    $invoiceId,
                    $item['product_id'] ?? null,
                    $item['quantity'],
                    $item['unit_price'],
                    $item['item_total']
                ]);
            }

            $this->pdo->commit();
            return $invoiceId;
        } catch (\PDOException $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function findById(int $id): ?array
    {
        $sql = "
            SELECT
                i.*,
                c.name AS customer_name,
                c.phone AS customer_phone,
                c.email AS customer_email
            FROM
                invoices i
            LEFT JOIN
                customers c ON i.customer_id = c.id
            WHERE
                i.id = ?
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id]);
        $invoice = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$invoice) {
            return null;
        }

        // Fetch items
        $itemsSql = "
            SELECT
                ii.*,
                p.name AS product_name
            FROM
                invoice_items ii
            LEFT JOIN
                products p ON ii.product_id = p.id
            WHERE
                ii.invoice_id = ?
        ";
        $itemsStmt = $this->pdo->prepare($itemsSql);
        $itemsStmt->execute([$id]);
        $invoice['items'] = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

        return $invoice;
    }

    public function findBySaleId(int $saleId): ?array
    {
        $sql = "SELECT * FROM invoices WHERE sale_id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$saleId]);
        $invoice = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$invoice) {
            return null;
        }

        // Fetch items
        $itemsSql = "SELECT * FROM invoice_items WHERE invoice_id = ?";
        $itemsStmt = $this->pdo->prepare($itemsSql);
        $itemsStmt->execute([$invoice['id']]);
        $invoice['items'] = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

        return $invoice;
    }

    public function update(int $id, array $invoiceData, array $itemsData): bool
    {
        $this->pdo->beginTransaction();
        try {
            // Update invoices table
            $sql = "UPDATE invoices SET customer_id = ?, invoice_date = ?, total_amount = ?, status = ? WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $invoiceData['customer_id'],
                $invoiceData['invoice_date'],
                $invoiceData['total_amount'],
                $invoiceData['status'],
                $id
            ]);

            // Delete existing items and insert new ones (simpler for update)
            $deleteItemsSql = "DELETE FROM invoice_items WHERE invoice_id = ?";
            $deleteStmt = $this->pdo->prepare($deleteItemsSql);
            $deleteStmt->execute([$id]);

            foreach ($itemsData as $item) {
                $itemSql = "INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, item_total) VALUES (?, ?, ?, ?, ?)";
                $itemStmt = $this->pdo->prepare($itemSql);
                $itemStmt->execute([
                    $id,
                    $item['product_id'] ?? null,
                    $item['quantity'],
                    $item['unit_price'],
                    $item['item_total']
                ]);
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
        $this->pdo->beginTransaction();
        try {
            // Delete items first due to foreign key constraint
            $deleteItemsSql = "DELETE FROM invoice_items WHERE invoice_id = ?";
            $deleteStmt = $this->pdo->prepare($deleteItemsSql);
            $deleteStmt->execute([$id]);

            $sql = "DELETE FROM invoices WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$id]);
            $this->pdo->commit();
            return $stmt->rowCount() > 0;
        } catch (\PDOException $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function getAll(int $limit, int $offset, array $filters): array
    {
        $baseSql = "FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id";
        $countSql = "SELECT COUNT(i.id) ";
        $selectSql = "SELECT i.id, i.sale_id, i.invoice_date, i.total_amount, i.status, c.name as customer_name, c.phone as customer_phone, c.email as customer_email ";

        $where = [];
        $bindings = [];

        if (!empty($filters['search'])) {
            $searchTerm = '%' . $filters['search'] . '%';
            // Search in customer name, sale_id, or product names within the invoice
            $where[] = "(c.name LIKE ? OR CAST(i.sale_id AS CHAR) LIKE ? OR EXISTS (SELECT 1 FROM invoice_items ii JOIN products p ON ii.product_id = p.id WHERE ii.invoice_id = i.id AND p.name LIKE ?))";
            $bindings[] = $searchTerm;
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

        $orderSql = " ORDER BY i.invoice_date DESC";

        // Get records for the current page
        $sql = $selectSql . $baseSql . $whereSql . $orderSql . " LIMIT ? OFFSET ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(array_merge($bindings, [$limit, $offset]));
        
        $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($invoices as &$invoice) {
            $itemsSql = "
                SELECT ii.quantity, ii.unit_price, ii.item_total, p.name AS product_name
                FROM invoice_items ii
                LEFT JOIN products p ON ii.product_id = p.id
                WHERE ii.invoice_id = ?
            ";
            $itemsStmt = $this->pdo->prepare($itemsSql);
            $itemsStmt->execute([$invoice['id']]);
            $invoice['items'] = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);
        }

        return [
            'data' => $invoices,
            'total' => $totalRecords
        ];
    }
}