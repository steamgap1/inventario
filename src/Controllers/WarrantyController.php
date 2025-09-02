<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use PDO;

class WarrantyController
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getAll(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $sql = "SELECT w.*, p.name as product_name FROM warranties w JOIN products p ON w.product_id = p.id";
        $bindings = [];

        if (!empty($params['search'])) {
            $sql .= " WHERE (p.name LIKE ? OR w.notes LIKE ?)";
            $bindings[] = '%' . $params['search'] . '%';
            $bindings[] = '%' . $params['search'] . '%';
        }

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($bindings);
        $warranties = $stmt->fetchAll();

        $response->getBody()->write(json_encode(['status' => 'success', 'data' => $warranties]));
        return $response;
    }

    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $stmt = $this->pdo->prepare("INSERT INTO warranties (product_id, start_date, end_date, notes) VALUES (?, ?, ?, ?)");
        $stmt->execute([$data['product_id'], $data['start_date'], $data['end_date'], $data['notes']]);
        $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Garantía creada']));
        return $response->withStatus(201);
    }

    public function updateStatus(Request $request, Response $response, array $args): Response
    {
        $data = $request->getParsedBody();
        $stmt = $this->pdo->prepare("UPDATE warranties SET status = ? WHERE id = ?");
        $stmt->execute([$data['status'], $args['id']]);
        $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Estado de garantía actualizado']));
        return $response;
    }
}
