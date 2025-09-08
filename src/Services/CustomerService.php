<?php

namespace App\Services;

use App\Repositories\CustomerRepository;

class CustomerService
{
    private $customerRepository;

    public function __construct(CustomerRepository $customerRepository)
    {
        $this->customerRepository = $customerRepository;
    }

    public function getAllCustomers(array $filters, int $page, int $limit): array
    {
        $offset = ($page - 1) * $limit;
        $result = $this->customerRepository->findAllPaginated($filters, $limit, $offset);
        
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

    public function getCustomer(int $id): ?array
    {
        return $this->customerRepository->findById($id);
    }

    public function createCustomer(array $data): bool
    {
        return $this->customerRepository->save($data);
    }

    public function updateCustomer(int $id, array $data): bool
    {
        $data['id'] = $id;
        return $this->customerRepository->save($data);
    }

    public function deleteCustomer(int $id): bool
    {
        return $this->customerRepository->delete($id);
    }
}
