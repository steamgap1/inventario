<?php

namespace App\Services;

use App\Repositories\SaleRepository;
use InvalidArgumentException;

class SaleService
{
    private $saleRepository;

    public function __construct(SaleRepository $saleRepository)
    {
        $this->saleRepository = $saleRepository;
    }

    public function createSale(array $data): array
    {
        // Basic validation
        if (empty($data['items'])) {
            throw new InvalidArgumentException("No se han proporcionado artículos para la venta.");
        }

        return $this->saleRepository->create($data);
    }

    public function getAllSales(int $page, int $limit, array $filters): array
    {
        $offset = ($page - 1) * $limit;
        $result = $this->saleRepository->getAll($limit, $offset, $filters);
        
        return [
            'data' => $result['data'],
            'pagination' => [
                'total' => $result['total'],
                'page' => $page,
                'limit' => $limit,
                'totalPages' => ceil($result['total'] / $limit)
            ]
        ];
    }

    public function getSale(int $id): ?array
    {
        return $this->saleRepository->findById($id);
    }

    public function updateSale(int $id, array $data): bool
    {
        // Basic validation
        if (empty($data['items'])) {
            throw new InvalidArgumentException("No se han proporcionado artículos para la venta.");
        }

        return $this->saleRepository->update($id, $data);
    }

    public function deleteSale(int $id): bool
    {
        return $this->saleRepository->delete($id);
    }
}