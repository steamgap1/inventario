<?php

namespace App\Controllers;

use App\Services\WarrantyService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class WarrantyController
{
    private $warrantyService;

    public function __construct(WarrantyService $warrantyService)
    {
        $this->warrantyService = $warrantyService;
    }

    public function getAll(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();

        $page = (int)($params['page'] ?? 1);
        $limit = (int)($params['limit'] ?? 10);

        $result = $this->warrantyService->getAllWarranties($params, $page, $limit);

        $response->getBody()->write(json_encode(['status' => 'success', 'data' => $result['data'], 'pagination' => $result['pagination']]));
        return $response;
    }

    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        try {
            $this->warrantyService->createWarranty($data);
            $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Garantía creada']));
            return $response->withStatus(201);
        } catch (\InvalidArgumentException $e) {
            $response->getBody()->write(json_encode(['status' => 'error', 'message' => $e->getMessage()]));
            return $response->withStatus(400);
        }
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        $data = $request->getParsedBody();

        try {
            $this->warrantyService->updateWarranty($id, $data);
            $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Garantía actualizada']));
            return $response;
        } catch (\InvalidArgumentException $e) {
            $response->getBody()->write(json_encode(['status' => 'error', 'message' => $e->getMessage()]));
            return $response->withStatus(400);
        }
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        $this->warrantyService->deleteWarranty($id);
        $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Garantía eliminada']));
        return $response;
    }
}
