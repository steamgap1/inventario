<?php

namespace App\Repositories;

use PDO;

class CustomerRepository
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function findAllPaginated(array $filters, int $limit, int $offset): array
    {
        $baseSql = "FROM customers";
        $countSql = "SELECT COUNT(id) ";
        $selectSql = "SELECT * ";

        $where = [];
        $bindings = [];

        if (!empty($filters['search'])) {
            $where[] = "(name LIKE ? OR identification LIKE ? OR email LIKE ?)";
            $bindings[] = '%' . $filters['search'] . '%';
            $bindings[] = '%' . $filters['search'] . '%';
            $bindings[] = '%' . $filters['search'] . '%';
        }

        $whereSql = '';
        if (count($where) > 0) {
            $whereSql = " WHERE " . implode(' AND ', $where);
        }

        $countStmt = $this->pdo->prepare($countSql . $baseSql . $whereSql);
        $countStmt->execute($bindings);
        $totalRecords = (int) $countStmt->fetchColumn();

        $orderSql = " ORDER BY name ASC";

        $sql = $selectSql . $baseSql . $whereSql . $orderSql . " LIMIT ? OFFSET ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(array_merge($bindings, [$limit, $offset]));
        
        $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'data' => $customers,
            'total' => $totalRecords
        ];
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM customers WHERE id = ?");
        $stmt->execute([$id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    public function save(array $data): bool
    {
        if (isset($data['id'])) {
            $sql = "UPDATE customers SET identification=?, name=?, phone=?, email=?, address=? WHERE id = ?";
            $params = [
                $data['identification'] ?? null,
                $data['name'],
                $data['phone'] ?? null,
                $data['email'] ?? null,
                $data['address'] ?? null,
                $data['id']
            ];
        } else {
            $sql = "INSERT INTO customers (identification, name, phone, email, address) VALUES (?, ?, ?, ?, ?)";
            $params = [
                $data['identification'] ?? null,
                $data['name'],
                $data['phone'] ?? null,
                $data['email'] ?? null,
                $data['address'] ?? null
            ];
        }
        
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($params);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare("DELETE FROM customers WHERE id = ?");
        return $stmt->execute([$id]);
    }
}
