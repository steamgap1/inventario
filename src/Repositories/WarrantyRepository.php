<?php

namespace App\Repositories;

use PDO;

class WarrantyRepository
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function findAllPaginated(array $filters, int $limit, int $offset): array
    {
        $baseSql = "FROM warranties w JOIN products p ON w.product_id = p.id LEFT JOIN customers c ON w.customer_id = c.id";
        $countSql = "SELECT COUNT(w.id) ";
        $selectSql = "SELECT w.*, p.name as product_name, c.name as customer_name ";

        $where = [];
        $bindings = [];

        if (!empty($filters['search'])) {
            $where[] = "(p.name LIKE ? OR w.notes LIKE ? OR c.name LIKE ?)";
            $bindings[] = '%' . $filters['search'] . '%';
            $bindings[] = '%' . $filters['search'] . '%';
            $bindings[] = '%' . $filters['search'] . '%';
        }

        $whereSql = '';
        if (count($where) > 0) {
            $whereSql = " WHERE " . implode(' AND ', $where);
        }

        // Get total count for pagination
        $countStmt = $this->pdo->prepare($countSql . $baseSql . $whereSql);
        $countStmt->execute($bindings);
        $totalRecords = (int) $countStmt->fetchColumn();

        $orderSql = " ORDER BY w.id DESC"; // Default sort by most recent

        // Get records for the current page
        $sql = $selectSql . $baseSql . $whereSql . $orderSql . " LIMIT ? OFFSET ? ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(array_merge($bindings, [$limit, $offset]));
        
        $warranties = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'data' => $warranties,
            'total' => $totalRecords
        ];
    }

    public function save(array $data): bool
    {
        if (isset($data['id'])) {
            $sql = "UPDATE warranties SET product_id = ?, customer_id = ?, start_date = ?, end_date = ?, notes = ?, status = ? WHERE id = ?";
            $params = [
                $data['product_id'], $data['customer_id'], $data['start_date'], $data['end_date'], 
                $data['notes'], $data['status'], $data['id']
            ];
        } else {
            $sql = "INSERT INTO warranties (product_id, customer_id, start_date, end_date, notes, status) VALUES (?, ?, ?, ?, ?, ?)";
            $params = [
                $data['product_id'], $data['customer_id'], $data['start_date'], $data['end_date'], 
                $data['notes'], $data['status'] ?? 'activa'
            ];
        }
        
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($params);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare("DELETE FROM warranties WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function findExpiredWarranties(): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT w.id, p.name as product_name FROM warranties w JOIN products p ON w.product_id = p.id WHERE w.status = 'activa' AND w.end_date < CURDATE()"
        );
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function updateStatus(int $id, string $status): bool
    {
        $stmt = $this->pdo->prepare("UPDATE warranties SET status = ? WHERE id = ?");
        return $stmt->execute([$status, $id]);
    }
}
