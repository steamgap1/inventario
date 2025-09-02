<?php
// api/routes.php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Routing\RouteCollectorProxy;
use Psr\Http\Server\RequestHandlerInterface; // Importar la interfaz
use App\Controllers\ProductController;
use App\Controllers\ProviderController;
use App\Controllers\SaleController;
use App\Controllers\WarrantyController;
use App\Controllers\ReportController;
use App\Controllers\AuthController;

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


// === RUTAS DE AUTENTICACIÓN - REFACTORIZADO ===
$authController = new \App\Controllers\AuthController(getPDO());
$app->post('/login', [$authController, 'login']);
$app->post('/logout', [$authController, 'logout']);


// === RUTAS DE PRODUCTOS (CRUD) - REFACTORIZADO ===
$app->group('/products', function (RouteCollectorProxy $group) use ($authMiddleware, $authAdminMiddleware) {
    $productController = new \App\Controllers\ProductController(getPDO());
    
    $group->get('', [$productController, 'getAll']);
    $group->post('', [$productController, 'create'])->add($authAdminMiddleware);
    $group->put('/{id}', [$productController, 'update'])->add($authAdminMiddleware);
    $group->delete('/{id}', [$productController, 'delete'])->add($authAdminMiddleware);
    $group->post('/{id}/upload', [$productController, 'uploadImage'])->add($authAdminMiddleware);

})->add($authMiddleware);


// === RUTAS DE PROVEEDORES (CRUD) - REFACTORIZADO ===
$app->group('/providers', function (RouteCollectorProxy $group) use ($authAdminMiddleware) {
    $providerController = new \App\Controllers\ProviderController(getPDO());

    $group->get('', [$providerController, 'getAll']);
    $group->post('', [$providerController, 'create']);
    $group->put('/{id}', [$providerController, 'update']);
    $group->delete('/{id}', [$providerController, 'delete']);
})->add($authAdminMiddleware);


// === RUTAS DE VENTAS (NUEVO) - REFACTORIZADO ===
$app->group('/sales', function (RouteCollectorProxy $group) {
    $saleController = new \App\Controllers\SaleController(getPDO());

    $group->post('', [$saleController, 'create']);
    $group->get('', [$saleController, 'getAll']);
})->add($authMiddleware); // Middleware para todo el grupo de ventas


// === RUTAS DE GARANTÍAS - REFACTORIZADO ===
$app->group('/warranties', function (RouteCollectorProxy $group) {
    $warrantyController = new \App\Controllers\WarrantyController(getPDO());

    $group->get('', [$warrantyController, 'getAll']);
    $group->post('', [$warrantyController, 'create']);
    $group->put('/{id}/status', [$warrantyController, 'updateStatus']);
})->add($authMiddleware);


// === RUTAS DE REPORTES - REFACTORIZADO ===
$app->group('/reports', function (RouteCollectorProxy $group) {
    $reportController = new \App\Controllers\ReportController(getPDO());

    $group->get('/inventory', [$reportController, 'getInventoryReport']);
    $group->get('/sales', [$reportController, 'getSalesReport']);
})->add($authAdminMiddleware);