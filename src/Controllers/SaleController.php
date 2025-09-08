<?php

namespace App\Controllers;

use App\Services\SaleService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use InvalidArgumentException;

class SaleController
{
    private $saleService;

    public function __construct(SaleService $saleService)
    {
        $this->saleService = $saleService;
    }

    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        try {
            $sale = $this->saleService->createSale($data);
            $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Venta registrada con éxito.', 'data' => $sale]));
            return $response->withStatus(201);
        } catch (InvalidArgumentException $e) {
            $response->getBody()->write(json_encode(['status' => 'error', 'message' => $e->getMessage()]));
            return $response->withStatus(400);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['status' => 'error', 'message' => 'Error al registrar la venta: ' . $e->getMessage()]));
            return $response->withStatus(500);
        }
    }

    public function getAll(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $page = (int)($params['page'] ?? 1);
        $limit = (int)($params['limit'] ?? 10);
        $filters = [
            'search' => $params['search'] ?? null
        ];

        $result = $this->saleService->getAllSales($page, $limit, $filters);

        $response->getBody()->write(json_encode(['status' => 'success', 'data' => $result['data'], 'pagination' => $result['pagination']]));
        return $response;
    }

    public function getOne(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        $sale = $this->saleService->getSale($id);

        if (!$sale) {
            $response->getBody()->write(json_encode(['status' => 'error', 'message' => 'Venta no encontrada.']));
            return $response->withStatus(404);
        }

        $response->getBody()->write(json_encode(['status' => 'success', 'data' => $sale]));
        return $response;
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        try {
            $id = (int)$args['id'];
            $data = $request->getParsedBody();
    
            $this->saleService->updateSale($id, $data);
            $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Venta actualizada con éxito.']));
            return $response;
        } catch (\Throwable $e) {
            $response->getBody()->write(json_encode(['status' => 'error', 'message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]));
            return $response->withStatus(500);
        }
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        try {
            $this->saleService->deleteSale($id);
            $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Venta eliminada con éxito.']));
            return $response;
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['status' => 'error', 'message' => 'Error al eliminar la venta: ' . $e->getMessage()]));
            return $response->withStatus(500);
        }
    }
}