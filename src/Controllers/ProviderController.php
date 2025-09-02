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
        $stmt = $this->pdo->query("SELECT * FROM providers");
        $providers = $stmt->fetchAll();
        $response->getBody()->write(json_encode(['status' => 'success', 'data' => $providers]));
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
