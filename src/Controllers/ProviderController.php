<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use PDO;

class ProviderController
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

        $baseSql = "FROM providers";
        $countSql = "SELECT COUNT(id) ";
        $selectSql = "SELECT * ";

        $where = [];
        $bindings = [];

        if (!empty($params['search'])) {
            $where[] = "(name LIKE ? OR contact_person LIKE ? OR phone LIKE ? OR email LIKE ?)";
            $bindings[] = '%' . $params['search'] . '%';
            $bindings[] = '%' . $params['search'] . '%';
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

        $orderSql = " ORDER BY id DESC"; // Default sort by most recent

        // Get records for the current page
        $sql = $selectSql . $baseSql . $whereSql . $orderSql . " LIMIT ? OFFSET ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(array_merge($bindings, [$limit, $offset]));
        
        $providers = $stmt->fetchAll();

        $response->getBody()->write(json_encode([
            'status' => 'success', 
            'data' => $providers,
            'pagination' => [
                'total' => $totalRecords,
                'page' => $page,
                'limit' => $limit,
                'totalPages' => ceil($totalRecords / $limit)
            ]
        ]));
        return $response;
    }

    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $stmt = $this->pdo->prepare("INSERT INTO providers (name, contact_person, phone, email) VALUES (?, ?, ?, ?)");
        $stmt->execute([$data['name'], $data['contact_person'], $data['phone'], $data['email']]);
        $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Proveedor creado']));
        return $response->withStatus(201);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $data = $request->getParsedBody();
        $stmt = $this->pdo->prepare("UPDATE providers SET name=?, contact_person=?, phone=?, email=? WHERE id = ?");
        $stmt->execute([$data['name'], $data['contact_person'], $data['phone'], $data['email'], $args['id']]);
        $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Proveedor actualizado']));
        return $response;
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $stmt = $this->pdo->prepare("DELETE FROM providers WHERE id = ?");
        $stmt->execute([$args['id']]);
        $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Proveedor eliminado']));
        return $response;
    }
}
