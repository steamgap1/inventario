<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use PDO;

class NotificationController
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getAllNotifications(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        $userId = $user['id'];

        $queryParams = $request->getQueryParams();
        $page = (int)($queryParams['page'] ?? 1);
        $limit = (int)($queryParams['limit'] ?? 10); // Default 10 notifications per page
        $offset = ($page - 1) * $limit;

        // Get total count for pagination
        $countStmt = $this->pdo->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = ?");
        $countStmt->execute([$userId]);
        $totalNotifications = $countStmt->fetchColumn();

        // Get notifications for the current page
        $stmt = $this->pdo->prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, is_read ASC LIMIT ? OFFSET ?");
        $stmt->execute([$userId, $limit, $offset]);
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $response->getBody()->write(json_encode([
            'status' => 'success',
            'data' => [
                'notifications' => $notifications,
                'total' => $totalNotifications,
                'page' => $page,
                'limit' => $limit,
                'totalPages' => ceil($totalNotifications / $limit)
            ]
        ]));
        return $response;
    }

    public function getUnreadCount(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        $userId = $user['id'];

        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = FALSE");
        $stmt->execute([$userId]);
        $count = $stmt->fetchColumn();

        $response->getBody()->write(json_encode(['status' => 'success', 'data' => ['count' => $count]]));
        return $response;
    }

    public function markAsRead(Request $request, Response $response, array $args): Response
    {
        $user = $request->getAttribute('user');
        $userId = $user['id'];
        $notificationId = $args['id'];

        $stmt = $this->pdo->prepare("UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?");
        $stmt->execute([$notificationId, $userId]);

        $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Notificación marcada como leída.']));
        return $response;
    }
}
