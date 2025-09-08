<?php

namespace App\Controllers;

use App\Services\CustomerService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class CustomerController
{
    private $customerService;

    public function __construct(CustomerService $customerService)
    {
        $this->customerService = $customerService;
    }

    public function getAll(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $page = (int)($params['page'] ?? 1);
        $limit = (int)($params['limit'] ?? 10);

        $result = $this->customerService->getAllCustomers($params, $page, $limit);

        $response->getBody()->write(json_encode(['status' => 'success', 'data' => $result['data'], 'pagination' => $result['pagination']]));
        return $response;
    }

    public function getOne(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        $customer = $this->customerService->getCustomer($id);

        if (!$customer) {
            $response->getBody()->write(json_encode(['status' => 'error', 'message' => 'Cliente no encontrado.']));
            return $response->withStatus(404);
        }

        $response->getBody()->write(json_encode(['status' => 'success', 'data' => $customer]));
        return $response;
    }

    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $this->customerService->createCustomer($data);
        $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Cliente creado con éxito.']));
        return $response->withStatus(201);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        $data = $request->getParsedBody();
        $this->customerService->updateCustomer($id, $data);
        $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Cliente actualizado con éxito.']));
        return $response;
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        $this->customerService->deleteCustomer($id);
        $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Cliente eliminado con éxito.']));
        return $response;
    }
}