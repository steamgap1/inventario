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
use App\Controllers\NotificationController;
use App\Controllers\CustomerController;
use App\Repositories\ProductRepository;
use App\Services\ProductService;
use App\Controllers\InvoiceController;
use App\Repositories\InvoiceRepository;
use App\Repositories\SaleRepository;
use App\Services\InvoiceService;
use App\Services\SaleService;

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
$app->get('/session', [$authController, 'checkSession']);


// === RUTAS DE PRODUCTOS (CRUD) - REFACTORIZADO ===
$app->group('/products', function (RouteCollectorProxy $group) use ($authMiddleware, $authAdminMiddleware) {
    // Dependency Injection
    $pdo = getPDO();
    $productRepository = new ProductRepository($pdo);
    $productService = new ProductService($productRepository);
    $productController = new ProductController($productService);
    
    $group->get('', [$productController, 'getAll']);
    $group->post('', [$productController, 'create'])->add($authAdminMiddleware);
    $group->put('/{id}', [$productController, 'update'])->add($authAdminMiddleware);
    $group->delete('/{id}', [$productController, 'delete'])->add($authAdminMiddleware);
    $group->post('/{id}/upload', [$productController, 'uploadImage'])->add($authAdminMiddleware);
    $group->get('/low-stock', [$productController, 'getLowStockProducts'])->add($authAdminMiddleware);

})->add($authMiddleware);


// === RUTAS DE PROVEEDORES (CRUD) - REFACTORIZADO ===
$app->group('/providers', function (RouteCollectorProxy $group) use ($authAdminMiddleware) {
    $providerController = new \App\Controllers\ProviderController(getPDO());

    $group->get('', [$providerController, 'getAll']);
    $group->post('', [$providerController, 'create']);
    $group->put('/{id}', [$providerController, 'update']);
    $group->delete('/{id}', [$providerController, 'delete']);
})->add($authAdminMiddleware);


// === RUTAS DE CLIENTES (NUEVO) ===
$app->group('/customers', function (RouteCollectorProxy $group) use ($authMiddleware, $authAdminMiddleware) {
    // Dependency Injection
    $pdo = getPDO();
    $customerRepository = new \App\Repositories\CustomerRepository($pdo);
    $customerService = new \App\Services\CustomerService($customerRepository);
    $customerController = new \App\Controllers\CustomerController($customerService);

    $group->get('', [$customerController, 'getAll']);
    $group->get('/{id}', [$customerController, 'getOne']);
    $group->post('', [$customerController, 'create'])->add($authAdminMiddleware);
    $group->put('/{id}', [$customerController, 'update'])->add($authAdminMiddleware);
    $group->delete('/{id}', [$customerController, 'delete'])->add($authAdminMiddleware);
})->add($authMiddleware);


// === RUTAS DE VENTAS (NUEVO) - REFACTORIZADO ===
$app->group('/sales', function (RouteCollectorProxy $group) use ($authMiddleware, $authAdminMiddleware) {
    // Dependency Injection
    $pdo = getPDO();
    $saleRepository = new SaleRepository($pdo);
    $saleService = new SaleService($saleRepository);
    $saleController = new SaleController($saleService);

    $group->post('', [$saleController, 'create']);
    $group->get('', [$saleController, 'getAll']);
    $group->get('/{id}', [$saleController, 'getOne']);
    $group->put('/{id}', [$saleController, 'update'])->add($authAdminMiddleware);
    $group->delete('/{id}', [$saleController, 'delete'])->add($authAdminMiddleware);
})->add($authMiddleware); // Middleware para todo el grupo de ventas


// === RUTAS DE GARANTÍAS - REFACTORIZADO ===
$app->group('/warranties', function (RouteCollectorProxy $group) use ($authMiddleware, $authAdminMiddleware) {
    // Dependency Injection
    $pdo = getPDO();
    $warrantyRepository = new \App\Repositories\WarrantyRepository($pdo);
    $warrantyService = new \App\Services\WarrantyService($warrantyRepository);
    $warrantyController = new \App\Controllers\WarrantyController($warrantyService);

    $group->get('', [$warrantyController, 'getAll']);
    $group->post('', [$warrantyController, 'create']);
    $group->put('/{id}', [$warrantyController, 'update'])->add($authAdminMiddleware);
    $group->delete('/{id}', [$warrantyController, 'delete'])->add($authAdminMiddleware);
})->add($authMiddleware);


// === RUTAS DE REPORTES - REFACTORIZADO ===
$app->group('/reports', function (RouteCollectorProxy $group) {
    $reportController = new \App\Controllers\ReportController(getPDO());

    $group->get('/inventory', [$reportController, 'getInventoryReport']);
    $group->get('/sales', [$reportController, 'getSalesReport']);
    $group->get('/pdf', [$reportController, 'generatePdfReport']); // Nueva ruta para PDF
    $group->get('/data', [$reportController, 'getReportData']); // Nueva ruta para datos JSON
})->add($authAdminMiddleware);


// === RUTAS DE COTIZACIONES (NUEVO) ===
$app->group('/quotes', function (RouteCollectorProxy $group) use ($authMiddleware, $authAdminMiddleware) {
    $quoteController = new \App\Controllers\QuoteController(getPDO());

    $group->get('', [$quoteController, 'getAll']);
    $group->get('/{id}', [$quoteController, 'getOne']);
    $group->post('', [$quoteController, 'create'])->add($authAdminMiddleware);
    $group->put('/{id}', [$quoteController, 'update'])->add($authAdminMiddleware);
    $group->delete('/{id}', [$quoteController, 'delete'])->add($authAdminMiddleware);
    $group->get('/{id}/pdf', [$quoteController, 'generatePdf'])->add($authAdminMiddleware);
})->add($authMiddleware);


// === RUTAS DE NOTIFICACIONES ===
$app->group('/notifications', function (RouteCollectorProxy $group) use ($authMiddleware) {
    $notificationController = new \App\Controllers\NotificationController(getPDO());

    $group->get('', [$notificationController, 'getAllNotifications']);
    $group->get('/unread-count', [$notificationController, 'getUnreadCount']);
    $group->post('/{id}/mark-read', [$notificationController, 'markAsRead']);
})->add($authMiddleware);


// === RUTAS DE FACTURAS (NUEVO) ===
$app->group('/invoices', function (RouteCollectorProxy $group) use ($authMiddleware, $authAdminMiddleware) {
    // Dependency Injection
    $pdo = getPDO();
    $invoiceRepository = new \App\Repositories\InvoiceRepository($pdo);
    $saleRepository = new \App\Repositories\SaleRepository($pdo);
    $invoiceService = new \App\Services\InvoiceService($invoiceRepository, $saleRepository);
    $invoiceController = new \App\Controllers\InvoiceController($invoiceService);

    $group->get('', [$invoiceController, 'getAllInvoices'])->add($authMiddleware);
    $group->post('/generate/{sale_id}', [$invoiceController, 'generateInvoice'])->add($authAdminMiddleware); // Generate invoice from sale
    $group->get('/{id}', [$invoiceController, 'getInvoice'])->add($authMiddleware);
    $group->put('/{id}', [$invoiceController, 'updateInvoice'])->add($authAdminMiddleware);
    $group->delete('/{id}', [$invoiceController, 'deleteInvoice'])->add($authAdminMiddleware);
    $group->get('/{id}/preview', [$invoiceController, 'previewInvoicePdf'])->add($authMiddleware); // Preview PDF
})->add($authMiddleware);