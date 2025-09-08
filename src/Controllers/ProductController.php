<?php

namespace App\Controllers;

use App\Services\ProductService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ProductController
{
    private $productService;

    public function __construct(ProductService $productService)
    {
        $this->productService = $productService;
    }

    public function getAll(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        $params = $request->getQueryParams();
        $params['user_role'] = $user['role']; // Pass user role to service

        $page = (int)($params['page'] ?? 1);
        $limit = (int)($params['limit'] ?? 10);

        $result = $this->productService->getAllProducts($params, $page, $limit);

        $response->getBody()->write(json_encode(['status' => 'success', 'data' => $result['data'], 'pagination' => $result['pagination']]));
        return $response;
    }

    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $this->productService->createProduct($data);
        $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Producto creado']));
        return $response->withStatus(201);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        $data = $request->getParsedBody();
        $this->productService->updateProduct($id, $data);
        $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Producto actualizado']));
        return $response;
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        $this->productService->deleteProduct($id);
        $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Producto desactivado']));
        return $response;
    }

    public function uploadImage(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        $uploadedFiles = $request->getUploadedFiles();
        
        if (empty($uploadedFiles['image'])) {
            $response->getBody()->write(json_encode(['status' => 'error', 'message' => 'No se ha subido ninguna imagen.']));
            return $response->withStatus(400);
        }

        try {
            $this->productService->uploadProductImage($id, $uploadedFiles['image']);
            $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Imagen subida']));
            return $response;
        } catch (\RuntimeException $e) {
            $response->getBody()->write(json_encode(['status' => 'error', 'message' => $e->getMessage()]));
            return $response->withStatus(500);
        }
    }

    public function getLowStockProducts(Request $request, Response $response): Response
    {
        $products = $this->productService->getLowStockProducts();
        $response->getBody()->write(json_encode(['status' => 'success', 'data' => $products]));
        return $response;
    }
}
