<?php

namespace App\Repositories;

use PDO;

class NotificationRepository
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function create(array $data): bool
    {
        $sql = "INSERT INTO notifications (user_id, message, type, link) VALUES (?, ?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([
            $data['user_id'],
            $data['message'],
            $data['type'],
            $data['link'] ?? null
        ]);
    }

    public function findExisting(int $userId, string $link, string $type): ?array
    {
        $sql = "SELECT id, message, is_read FROM notifications WHERE user_id = ? AND link = ? AND type = ? ORDER BY created_at DESC LIMIT 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$userId, $link, $type]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    public function update(int $id, string $message): bool
    {
        $sql = "UPDATE notifications SET message = ?, is_read = 0, created_at = CURRENT_TIMESTAMP WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$message, $id]);
    }
}
