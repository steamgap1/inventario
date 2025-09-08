<?php

namespace App\Repositories;

use PDO;

class ProductRepository
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function find(int $id): ?array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->execute([$id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    public function findAllPaginated(array $filters, int $limit, int $offset): array
    {
        $userRole = $filters['user_role'] ?? 'cliente';

        // Base SQL
        $baseSql = "FROM products p LEFT JOIN providers pr ON p.provider_id = pr.id WHERE p.is_active = 1";
        $countSql = "SELECT COUNT(p.id) ";

        // Determine which price column to show
        if ($userRole === 'admin') {
            $selectSql = "SELECT p.*, pr.name as provider_name ";
        } else {
            $priceColumn = 'price_client';
            if ($userRole === 'vendedor') {
                $priceColumn = 'price_wholesale';
            }
            $selectSql = "SELECT p.id, p.name, p.description, p.stock, p.condition, p.image_path, {$priceColumn} as price, pr.name as provider_name ";
        }

        // Build WHERE clause
        $where = [];
        $bindings = [];

        if (!empty($filters['search'])) {
            $where[] = "(p.name LIKE ? OR p.description LIKE ?)";
            $bindings[] = '%' . $filters['search'] . '%';
            $bindings[] = '%' . $filters['search'] . '%';
        }

        if (isset($filters['low_stock']) && $filters['low_stock'] === 'true') {
            $where[] = "p.stock < 50";
        }
        
        $whereSql = '';
        if (count($where) > 0) {
            $whereSql = " AND " . implode(' AND ', $where);
        }

        // Get total count for pagination
        $countStmt = $this->pdo->prepare($countSql . $baseSql . $whereSql);
        $countStmt->execute($bindings);
        $totalRecords = (int) $countStmt->fetchColumn();

        // Build ORDER BY clause
        $orderBy = [];
        if (!empty($filters['stock_order']) && in_array(strtoupper($filters['stock_order']), ['ASC', 'DESC'])) {
            $orderBy[] = "p.stock " . strtoupper($filters['stock_order']);
        }
        if (!empty($filters['price_order'])) {
            $priceSortColumn = 'p.price_client'; // Default for admin
            if ($userRole !== 'admin') {
                $priceSortColumn = 'price'; // Use the alias for other roles
            }
            if (in_array(strtoupper($filters['price_order']), ['ASC', 'DESC'])) {
                $orderBy[] = $priceSortColumn . " " . strtoupper($filters['price_order']);
            }
        }

        $orderSql = '';
        if (count($orderBy) > 0) {
            $orderSql = " ORDER BY " . implode(', ', $orderBy);
        } else {
            $orderSql = " ORDER BY p.id DESC"; // Default sort by most recent
        }

        // Get records for the current page
        $sql = $selectSql . $baseSql . $whereSql . $orderSql . " LIMIT ? OFFSET ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(array_merge($bindings, [$limit, $offset]));
        
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'data' => $products,
            'total' => $totalRecords
        ];
    }

    public function save(array $data): bool
    {
        if (isset($data['id'])) {
            $sql = "UPDATE products SET name=?, description=?, stock=?, `condition`=?, cost=?, price_client=?, price_wholesale=?, price_technician=?, provider_id=?, entry_date=?, warranty_expires_on=? WHERE id = ?";
            $params = [
                $data['name'], $data['description'], $data['stock'], $data['condition'], 
                $data['cost'], $data['price_client'], $data['price_wholesale'], $data['price_technician'],
                $data['provider_id'] ?? null, $data['entry_date'] ?? null, $data['warranty_expires_on'] ?? null,
                $data['id']
            ];
        } else {
            $sql = "INSERT INTO products (name, description, stock, `condition`, cost, price_client, price_wholesale, price_technician, provider_id, entry_date, warranty_expires_on) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $params = [
                $data['name'], $data['description'], $data['stock'], $data['condition'], 
                $data['cost'], $data['price_client'], $data['price_wholesale'], $data['price_technician'],
                $data['provider_id'] ?? null, $data['entry_date'] ?? null, $data['warranty_expires_on'] ?? null
            ];
        }
        
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($params);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare("UPDATE products SET is_active = 0 WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function updateImagePath(int $id, string $path): bool
    {
        $stmt = $this->pdo->prepare("UPDATE products SET image_path = ? WHERE id = ?");
        return $stmt->execute([$path, $id]);
    }

    public function findLowStock(): array
    {
        $stmt = $this->pdo->query("SELECT id, name, stock FROM products WHERE stock < 50 AND is_active = 1 ORDER BY stock ASC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findOutOfStock(): array
    {
        $stmt = $this->pdo->query("SELECT id, name FROM products WHERE stock = 0 AND is_active = 1");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function countLowStock(): int
    {
        $stmt = $this->pdo->query("SELECT COUNT(*) FROM products WHERE stock > 0 AND stock < 50 AND is_active = 1");
        return (int)$stmt->fetchColumn();
    }
}