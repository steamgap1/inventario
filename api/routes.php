<?php
// api/routes.php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Routing\RouteCollectorProxy;
use Psr\Http\Server\RequestHandlerInterface; // Importar la interfaz

// Ruta para servir el frontend
$app->get('/', function (Request $request, Response $response) {
    $file = __DIR__ . '/../public/index.html';
    if (file_exists($file)) {
        $response->getBody()->write(file_get_contents($file));
        return $response->withHeader('Content-Type', 'text/html');
    } else {
        $response->getBody()->write('index.html no encontrado.');
        return $response->withStatus(500);
    }
});

// Middleware de autenticación simple
$authMiddleware = function (Request $request, RequestHandlerInterface $handler): Response {
    if (!isset($_SESSION['user'])) {
        $response = new \Slim\Psr7\Response();
        $response->getBody()->write(json_encode(['status' => 'error', 'message' => 'No autorizado']));
        return $response->withStatus(401);
    }
    $request = $request->withAttribute('user', $_SESSION['user']);
    return $handler->handle($request);
};

$authAdminMiddleware = function (Request $request, RequestHandlerInterface $handler): Response {
    if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
        $response = new \Slim\Psr7\Response();
        $response->getBody()->write(json_encode(['status' => 'error', 'message' => 'Acceso denegado. Se requiere rol de administrador.']));
        return $response->withStatus(403);
    }
    $request = $request->withAttribute('user', $_SESSION['user']);
    return $handler->handle($request);
};


// === RUTAS DE AUTENTICACIÓN ===
$app->post('/login', function (Request $request, Response $response) {
    $data = $request->getParsedBody();
    $pdo = getPDO();
    $stmt = $pdo->prepare('SELECT * FROM users WHERE username = ?');
    $stmt->execute([$data['username']]);
    $user = $stmt->fetch();
    if ($user && $data['password'] === 'password123') { // En una app real, usar password_verify()
        $_SESSION['user'] = ['id' => $user['id'], 'username' => $user['username'], 'role' => $user['role']];
        $response->getBody()->write(json_encode(['status' => 'success', 'data' => $_SESSION['user']]));
        return $response->withStatus(200);
    }
    $response->getBody()->write(json_encode(['status' => 'error', 'message' => 'Credenciales incorrectas']));
    return $response->withStatus(401);
});

$app->post('/logout', function (Request $request, Response $response) {
    session_destroy();
    $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Sesión cerrada']));
    return $response->withStatus(200);
});


// === RUTAS DE PRODUCTOS (CRUD) - ACTUALIZADO ===
$app->group('/products', function (RouteCollectorProxy $group) use ($authAdminMiddleware) {
    
    $group->get('', function (Request $request, Response $response) {
        $user = $request->getAttribute('user');
        $pdo = getPDO();
        
        // El rol de admin ve todos los precios, los demás ven el precio que les corresponde.
        if ($user['role'] === 'admin') {
            $sql = "SELECT p.*, pr.name as provider_name FROM products p LEFT JOIN providers pr ON p.provider_id = pr.id WHERE p.is_active = 1";
            $stmt = $pdo->query($sql);
        } else {
            $priceColumn = 'price_client'; // Precio por defecto para rol 'cliente'
            if ($user['role'] === 'vendedor') {
                $priceColumn = 'price_wholesale';
            } // Podríamos añadir más roles aquí, como 'tecnico'

            $sql = "SELECT p.id, p.name, p.description, p.stock, p.condition, p.image_path, {$priceColumn} as price, pr.name as provider_name 
                    FROM products p LEFT JOIN providers pr ON p.provider_id = pr.id WHERE p.is_active = 1";
            $stmt = $pdo->query($sql);
        }

        $products = $stmt->fetchAll();
        $response->getBody()->write(json_encode(['status' => 'success', 'data' => $products]));
        return $response;
    });

    $group->post('', function (Request $request, Response $response) {
        $data = $request->getParsedBody();
        $pdo = getPDO();
        $sql = "INSERT INTO products (name, description, stock, `condition`, cost, price_client, price_wholesale, price_technician, provider_id, entry_date, warranty_expires_on) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        
        // Usar null si el valor está vacío o no está seteado
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
    })->add($authAdminMiddleware);

    $group->put('/{id}', function (Request $request, Response $response, array $args) {
        $data = $request->getParsedBody();
        $pdo = getPDO();
        $sql = "UPDATE products SET name=?, description=?, stock=?, `condition`=?, cost=?, price_client=?, price_wholesale=?, price_technician=?, provider_id=?, entry_date=?, warranty_expires_on=?
                WHERE id = ?";
        $stmt = $pdo->prepare($sql);

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
    })->add($authAdminMiddleware);

    // DELETE y upload no necesitan cambios mayores
    $group->delete('/{id}', function (Request $request, Response $response, array $args) {
        $pdo = getPDO();
        $stmt = $pdo->prepare("UPDATE products SET is_active = 0 WHERE id = ?");
        $stmt->execute([$args['id']]);
        $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Producto desactivado']));
        return $response;
    })->add($authAdminMiddleware);

    $group->post('/{id}/upload', function (Request $request, Response $response, array $args) {
        $directory = __DIR__ . '/../public/uploads';
        $uploadedFiles = $request->getUploadedFiles();
        $uploadedFile = $uploadedFiles['image'];

        if ($uploadedFile->getError() === UPLOAD_ERR_OK) {
            $filename = uniqid() . '-' . $uploadedFile->getClientFilename();
            $path = $directory . DIRECTORY_SEPARATOR . $filename;
            $uploadedFile->moveTo($path);

            // Guardar ruta en la BD
            $pdo = getPDO();
            $stmt = $pdo->prepare("UPDATE products SET image_path = ? WHERE id = ?");
            $stmt->execute(['uploads/' . $filename, $args['id']]);

            $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Imagen subida']));
            return $response;
        }

        $response->getBody()->write(json_encode(['status' => 'error', 'message' => 'Error al subir la imagen']));
        return $response->withStatus(500);
    })->add($authAdminMiddleware);

})->add($authMiddleware);


// === RUTAS DE PROVEEDORES (CRUD) ===
$app->group('/providers', function (RouteCollectorProxy $group) {
    $group->get('', function (Request $request, Response $response) {
        $pdo = getPDO();
        $stmt = $pdo->query("SELECT * FROM providers");
        $providers = $stmt->fetchAll();
        $response->getBody()->write(json_encode(['status' => 'success', 'data' => $providers]));
        return $response;
    });

    $group->post('', function (Request $request, Response $response) {
        $data = $request->getParsedBody();
        $pdo = getPDO();
        $stmt = $pdo->prepare("INSERT INTO providers (name, contact_person, phone, email) VALUES (?, ?, ?, ?)");
        $stmt->execute([$data['name'], $data['contact_person'], $data['phone'], $data['email']]);
        $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Proveedor creado']));
        return $response->withStatus(201);
    });

    $group->put('/{id}', function (Request $request, Response $response, array $args) {
        $data = $request->getParsedBody();
        $pdo = getPDO();
        $stmt = $pdo->prepare("UPDATE providers SET name=?, contact_person=?, phone=?, email=? WHERE id = ?");
        $stmt->execute([$data['name'], $data['contact_person'], $data['phone'], $data['email'], $args['id']]);
        $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Proveedor actualizado']));
        return $response;
    });

    $group->delete('/{id}', function (Request $request, Response $response, array $args) {
        $pdo = getPDO();
        $stmt = $pdo->prepare("DELETE FROM providers WHERE id = ?");
        $stmt->execute([$args['id']]);
        $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Proveedor eliminado']));
        return $response;
    });
})->add($authAdminMiddleware);


// === RUTAS DE VENTAS (NUEVO) ===
$app->group('/sales', function (RouteCollectorProxy $group) {
    // Registrar una venta
    $group->post('', function (Request $request, Response $response) {
        $data = $request->getParsedBody();
        $pdo = getPDO();

        $productId = $data['product_id'];
        $quantity = $data['quantity'];
        $salePrice = $data['sale_price'];
        $customerName = $data['customer_name'] ?? null;
        $notes = $data['notes'] ?? null;

        try {
            $pdo->beginTransaction();

            // 1. Verificar stock actual
            $stmt = $pdo->prepare("SELECT stock FROM products WHERE id = ? FOR UPDATE"); // FOR UPDATE para bloquear la fila
            $stmt->execute([$productId]);
            $currentStock = $stmt->fetchColumn();

            if ($currentStock === false || $currentStock < $quantity) {
                $pdo->rollBack();
                $response->getBody()->write(json_encode(['status' => 'error', 'message' => 'Stock insuficiente o producto no encontrado.']));
                return $response->withStatus(400);
            }

            // 2. Insertar la venta
            $stmt = $pdo->prepare("INSERT INTO sales (product_id, quantity, sale_price, customer_name, notes) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$productId, $quantity, $salePrice, $customerName, $notes]);

            // 3. Actualizar el stock del producto
            $newStock = $currentStock - $quantity;
            $stmt = $pdo->prepare("UPDATE products SET stock = ? WHERE id = ?");
            $stmt->execute([$newStock, $productId]);

            $pdo->commit();
            $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Venta registrada y stock actualizado.']));
            return $response->withStatus(201);

        } catch (\PDOException $e) {
            $pdo->rollBack();
            $response->getBody()->write(json_encode(['status' => 'error', 'message' => 'Error al registrar la venta: ' . $e->getMessage()]));
            return $response->withStatus(500);
        }
    }); // Vendedores pueden registrar ventas

    // Listar ventas
    $group->get('', function (Request $request, Response $response) {
        $pdo = getPDO();
        $sql = "SELECT s.*, p.name as product_name FROM sales s JOIN products p ON s.product_id = p.id ORDER BY s.sale_date DESC";
        $stmt = $pdo->query($sql);
        $sales = $stmt->fetchAll();
        $response->getBody()->write(json_encode(['status' => 'success', 'data' => $sales]));
        return $response;
    }); // Solo admins pueden ver el historial de ventas

})->add($authMiddleware); // Middleware para todo el grupo de ventas


// === RUTAS DE GARANTÍAS ===
$app->group('/warranties', function (RouteCollectorProxy $group) {
    
    $group->get('', function (Request $request, Response $response) {
        $pdo = getPDO();
        $warranties = $pdo->query("SELECT w.*, p.name as product_name FROM warranties w JOIN products p ON w.product_id = p.id")->fetchAll();
        $response->getBody()->write(json_encode(['status' => 'success', 'data' => $warranties]));
        return $response;
    });

    $group->post('', function (Request $request, Response $response) {
        $data = $request->getParsedBody();
        $pdo = getPDO();
        $stmt = $pdo->prepare("INSERT INTO warranties (product_id, start_date, end_date, notes) VALUES (?, ?, ?, ?)");
        $stmt->execute([$data['product_id'], $data['start_date'], $data['end_date'], $data['notes']]);
        $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Garantía creada']));
        return $response->withStatus(201);
    });

    $group->put('/{id}/status', function (Request $request, Response $response, array $args) {
        $data = $request->getParsedBody();
        $pdo = getPDO();
        $stmt = $pdo->prepare("UPDATE warranties SET status = ? WHERE id = ?");
        $stmt->execute([$data['status'], $args['id']]);
        $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Estado de garantía actualizado']));
        return $response;
    });

})->add($authMiddleware);


// === RUTAS DE REPORTES - ACTUALIZADO ===
$app->group('/reports', function (RouteCollectorProxy $group) {
    $group->get('/inventory', function (Request $request, Response $response) {
        $pdo = getPDO();
        $lowStock = $pdo->query("SELECT id, name, stock FROM products WHERE stock < 50 AND is_active = 1")->fetchAll();
        // Valor total del inventario basado en el costo
        $totalValueStmt = $pdo->query("SELECT SUM(stock * cost) as total_value FROM products WHERE is_active = 1");
        $totalValue = $totalValueStmt->fetchColumn();
        $report = [
            'low_stock_items' => $lowStock,
            'total_inventory_value' => (float)$totalValue,
            'generated_at' => date(DateTime::ISO8601)
        ];
        $response->getBody()->write(json_encode(['status' => 'success', 'data' => $report]));
        return $response;
    });

    $group->get('/sales', function (Request $request, Response $response) {
        $pdo = getPDO();
        $sql = "SELECT s.*, p.name as product_name FROM sales s JOIN products p ON s.product_id = p.id ORDER BY s.sale_date DESC";
        $stmt = $pdo->query($sql);
        $sales = $stmt->fetchAll();
        $response->getBody()->write(json_encode(['status' => 'success', 'data' => $sales]));
        return $response;
    });
})->add($authAdminMiddleware);