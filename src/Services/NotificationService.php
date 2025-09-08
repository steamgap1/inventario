<?php

namespace App\Services;

use App\Repositories\NotificationRepository;
use App\Repositories\ProductRepository;
use App\Repositories\WarrantyRepository;
use PDO;

class NotificationService
{
    private $notificationRepository;
    private $productRepository;
    private $warrantyRepository;
    private $pdo; // Added for transaction management

    public function __construct(NotificationRepository $notificationRepository, ProductRepository $productRepository, WarrantyRepository $warrantyRepository, PDO $pdo)
    {
        $this->notificationRepository = $notificationRepository;
        $this->productRepository = $productRepository;
        $this->warrantyRepository = $warrantyRepository;
        $this->pdo = $pdo;
    }

    public function generateSystemNotifications(array $adminUserIds)
    {
        if (empty($adminUserIds)) {
            return;
        }

        $this->pdo->beginTransaction();
        try {
            // 1. Notificaciones de STOCK CERO (Producto Agotado)
            $outOfStockProducts = $this->productRepository->findOutOfStock();

            foreach ($outOfStockProducts as $product) {
                $link = 'products/edit/' . $product['id'];
                $message = "¡Producto Agotado! El producto '{$product['name']}' ha llegado a 0 unidades.";

                foreach ($adminUserIds as $userId) {
                    $existingNotification = $this->notificationRepository->findExisting($userId, $link, 'error');
                    if ($existingNotification === null) {
                        $this->notificationRepository->create([
                            'user_id' => $userId,
                            'message' => $message,
                            'type' => 'error',
                            'link' => $link
                        ]);
                    }
                }
            }

            // 2. Notificación ÚNICA y DINÁMICA de STOCK BAJO
            $lowStockCount = $this->productRepository->countLowStock();
            $genericLink = 'products/low_stock_report';
            $newMessage = "Hay {$lowStockCount} productos con bajo nivel de stock.";

            foreach ($adminUserIds as $userId) {
                $existingNotification = $this->notificationRepository->findExisting($userId, $genericLink, 'warning');

                if ($lowStockCount > 0) {
                    if ($existingNotification) {
                        if ($existingNotification['message'] !== $newMessage || $existingNotification['is_read']) {
                            $this->notificationRepository->update($existingNotification['id'], $newMessage);
                        }
                    } else {
                        $this->notificationRepository->create([
                            'user_id' => $userId,
                            'message' => $newMessage,
                            'type' => 'warning',
                            'link' => $genericLink
                        ]);
                    }
                } else if ($existingNotification) {
                    // If low stock count is 0 but a notification exists, mark it as read or delete it
                    // For now, let's just update its message to reflect 0 products
                    if ($existingNotification['message'] !== "No hay productos con bajo nivel de stock." || $existingNotification['is_read']) {
                         $this->notificationRepository->update($existingNotification['id'], "No hay productos con bajo nivel de stock.");
                    }
                }
            }

            // 3. Notificaciones de GARANTÍAS EXPIRADAS
            $expiredWarranties = $this->warrantyRepository->findExpiredWarranties();

            foreach ($expiredWarranties as $warranty) {
                $link = 'warranties/edit/' . $warranty['id'];
                $message = "¡Garantía Expirada! La garantía del producto '{$warranty['product_name']}' (ID: {$warranty['id']}) ha expirado.";

                foreach ($adminUserIds as $userId) {
                    $existingNotification = $this->notificationRepository->findExisting($userId, $link, 'info');
                    if ($existingNotification === null) {
                        $this->notificationRepository->create([
                            'user_id' => $userId,
                            'message' => $message,
                            'type' => 'info',
                            'link' => $link
                        ]);
                    }
                }
            }

            $this->pdo->commit();
        } catch (\Exception $e) {
            $this->pdo->rollBack();
            error_log('Error generating system notifications: ' . $e->getMessage());
            throw $e; // Re-throw to be caught by controller if needed
        }
    }
}
