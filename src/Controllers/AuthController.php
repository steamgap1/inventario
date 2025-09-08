<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use PDO;
use App\Repositories\ProductRepository;
use App\Repositories\WarrantyRepository;
use App\Repositories\NotificationRepository;
use App\Services\NotificationService;

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
            
            // Trigger notifications check for admin users
            if ($user['role'] === 'admin') {
                $this->triggerNotificationsForUser();
            }

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

    public function checkSession(Request $request, Response $response): Response
    {
        if (isset($_SESSION['user'])) {
            $response->getBody()->write(json_encode(['status' => 'success', 'data' => $_SESSION['user']]));
            return $response->withStatus(200);
        } else {
            $response->getBody()->write(json_encode(['status' => 'error', 'message' => 'No hay sesión activa']));
            return $response->withStatus(401);
        }
    }

    private function triggerNotificationsForUser()
    {
        // Get all admin user IDs
        $stmt = $this->pdo->query("SELECT id FROM users WHERE role = 'admin'");
        $adminUserIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

        if (empty($adminUserIds)) {
            return; // No admins to notify
        }

        // Instantiate repositories
        $productRepository = new ProductRepository($this->pdo);
        $warrantyRepository = new WarrantyRepository($this->pdo);
        $notificationRepository = new NotificationRepository($this->pdo);

        // Instantiate NotificationService
        $notificationService = new NotificationService($notificationRepository, $productRepository, $warrantyRepository, $this->pdo);

        // Trigger notification creation
        $notificationService->generateSystemNotifications($adminUserIds);
    }
}
