<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use PDO;

class AuthController
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function login(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $stmt = $this->pdo->prepare('SELECT * FROM users WHERE username = ?');
        $stmt->execute([$data['username']]);
        $user = $stmt->fetch();

        if ($user && password_verify($data['password'], $user['password_hash'])) {
            $_SESSION['user'] = ['id' => $user['id'], 'username' => $user['username'], 'role' => $user['role']];
            $response->getBody()->write(json_encode(['status' => 'success', 'data' => $_SESSION['user']]));
            return $response->withStatus(200);
        }

        $response->getBody()->write(json_encode(['status' => 'error', 'message' => 'Credenciales incorrectas']));
        return $response->withStatus(401);
    }

    public function logout(Request $request, Response $response): Response
    {
        session_destroy();
        $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Sesión cerrada']));
        return $response->withStatus(200);
    }
}
