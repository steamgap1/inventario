<?php
// public/index.php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

// Iniciar sesión para la autenticación
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../config/database.php';

// Crear la instancia de la aplicación Slim
$app = AppFactory::create();

// Middleware para parsear el cuerpo de las solicitudes como JSON
$app->addBodyParsingMiddleware();

// La cabecera Content-Type se gestiona en cada ruta individualmente.

// Middleware de ruteo
$app->addRoutingMiddleware();

// Middleware para manejo de errores (simple)
$errorMiddleware = $app->addErrorMiddleware(true, true, true);
$errorMiddleware->setDefaultErrorHandler(
    function (Request $request, Throwable $exception, bool $displayErrorDetails) use ($app) {
        $response = $app->getResponseFactory()->createResponse();
        $statusCode = $exception->getCode() ? $exception->getCode() : 500;
        
        $response->getBody()->write(json_encode([
            'status' => 'error',
            'message' => $exception->getMessage()
        ]));

        return $response->withStatus($statusCode)->withHeader('Content-Type', 'application/json');
    }
);

// Definir la ruta base de la API
$app->setBasePath("/inventario/public");

// Cargar las rutas de la API
require __DIR__ . '/../api/routes.php';

// Ejecutar la aplicación
$app->run();
