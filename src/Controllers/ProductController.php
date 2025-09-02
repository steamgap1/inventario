<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use PDO;

class ProductController
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getAll(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        $params = $request->getQueryParams();

        // Base SQL
        $baseSql = "FROM products p LEFT JOIN providers pr ON p.provider_id = pr.id WHERE p.is_active = 1";
        
        // Determine which price column to show
        if ($user['role'] === 'admin') {
            $selectSql = "SELECT p.*, pr.name as provider_name ";
        } else {
            $priceColumn = 'price_client';
            if ($user['role'] === 'vendedor') {
                $priceColumn = 'price_wholesale';
            }
            $selectSql = "SELECT p.id, p.name, p.description, p.stock, p.condition, p.image_path, {$priceColumn} as price, pr.name as provider_name ";
        }

        // Build WHERE clause
        $where = [];
        $bindings = [];

        if (!empty($params['search'])) {
            $where[] = "(p.name LIKE ? OR p.description LIKE ?)";
            $bindings[] = '%' . $params['search'] . '%';
            $bindings[] = '%' . $params['search'] . '%';
        }

        if (isset($params['low_stock']) && $params['low_stock'] === 'true') {
            $where[] = "p.stock < 50";
        }
        
        $sql = $selectSql . $baseSql;
        if (count($where) > 0) {
            // Since the base SQL already has a WHERE, we need to use AND
            $sql .= " AND " . implode(' AND ', $where);
        }

        // Build ORDER BY clause
        $orderBy = [];
        if (!empty($params['stock_order']) && in_array(strtoupper($params['stock_order']), ['ASC', 'DESC'])) {
            $orderBy[] = "p.stock " . strtoupper($params['stock_order']);
        }
        if (!empty($params['price_order'])) {
            $priceSortColumn = 'p.price_client'; // Default for admin
            if ($user['role'] !== 'admin') {
                $priceSortColumn = 'price'; // Use the alias for other roles
            }
            if (in_array(strtoupper($params['price_order']), ['ASC', 'DESC'])) {
                $orderBy[] = $priceSortColumn . " " . strtoupper($params['price_order']);
            }
        }

        if (count($orderBy) > 0) {
            $sql .= " ORDER BY " . implode(', ', $orderBy);
        }

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($bindings);
        
        $products = $stmt->fetchAll();
        $response->getBody()->write(json_encode(['status' => 'success', 'data' => $products]));
        return $response;
    }

    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $sql = "INSERT INTO products (name, description, stock, `condition`, cost, price_client, price_wholesale, price_technician, provider_id, entry_date, warranty_expires_on) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        
        $provider_id = !empty($data['provider_id']) ? $data['provider_id'] : null;
        $entry_date = !empty($data['entry_date']) ? $data['entry_date'] : null;
        $warranty_expires_on = !empty($data['warranty_expires_on']) ? $data['warranty_expires_on'] : null;

        $stmt->execute([
            $data['name'], $data['description'], $data['stock'], $data['condition'], 
            $data['cost'], $data['price_client'], $data['price_wholesale'], $data['price_technician'],
            $provider_id, $entry_date, $warranty_expires_on
        ]);
        
        $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Producto creado']));
        return $response->withStatus(201);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $data = $request->getParsedBody();
        $sql = "UPDATE products SET name=?, description=?, stock=?, `condition`=?, cost=?, price_client=?, price_wholesale=?, price_technician=?, provider_id=?, entry_date=?, warranty_expires_on=?
                WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);

        $provider_id = !empty($data['provider_id']) ? $data['provider_id'] : null;
        $entry_date = !empty($data['entry_date']) ? $data['entry_date'] : null;
        $warranty_expires_on = !empty($data['warranty_expires_on']) ? $data['warranty_expires_on'] : null;

        $stmt->execute([
            $data['name'], $data['description'], $data['stock'], $data['condition'], 
            $data['cost'], $data['price_client'], $data['price_wholesale'], $data['price_technician'],
            $provider_id, $entry_date, $warranty_expires_on, $args['id']
        ]);

        $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Producto actualizado']));
        return $response;
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $stmt = $this->pdo->prepare("UPDATE products SET is_active = 0 WHERE id = ?");
        $stmt->execute([$args['id']]);
        $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Producto desactivado']));
        return $response;
    }

    public function uploadImage(Request $request, Response $response, array $args): Response
    {
        $directory = __DIR__ . '/../../public/uploads';
        $uploadedFiles = $request->getUploadedFiles();
        $uploadedFile = $uploadedFiles['image'];

        if ($uploadedFile->getError() === UPLOAD_ERR_OK) {
            $filename = uniqid() . '-' . $uploadedFile->getClientFilename();
            $path = $directory . DIRECTORY_SEPARATOR . $filename;
            $uploadedFile->moveTo($path);

            $stmt = $this->pdo->prepare("UPDATE products SET image_path = ? WHERE id = ?");
            $stmt->execute(['uploads/' . $filename, $args['id']]);

            $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Imagen subida']));
            return $response;
        }

        $response->getBody()->write(json_encode(['status' => 'error', 'message' => 'Error al subir la imagen']));
        return $response->withStatus(500);
    }
}