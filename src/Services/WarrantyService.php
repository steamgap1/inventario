<?php

namespace App\Services;

use App\Repositories\WarrantyRepository;

class WarrantyService
{
    private $warrantyRepository;

    public function __construct(WarrantyRepository $warrantyRepository)
    {
        $this->warrantyRepository = $warrantyRepository;
    }

    public function getAllWarranties(array $filters, int $page, int $limit): array
    {
        $offset = ($page - 1) * $limit;
        $result = $this->warrantyRepository->findAllPaginated($filters, $limit, $offset);
        
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

    public function createWarranty(array $data): bool
    {
        date_default_timezone_set('UTC');
        // Validation logic for dates (moved from controller)
        $startDate = (new \DateTime($data['start_date']))->setTime(0, 0, 0);
        $endDate = (new \DateTime($data['end_date']))->setTime(0, 0, 0);
        $today = (new \DateTime())->setTime(0, 0, 0);

        error_log("DEBUG: startDate = " . $startDate->format('Y-m-d H:i:s') . " (timezone: " . $startDate->getTimezone()->getName() . ")");
        error_log("DEBUG: endDate = " . $endDate->format('Y-m-d H:i:s') . " (timezone: " . $endDate->getTimezone()->getName() . ")");
        error_log("DEBUG: today = " . $today->format('Y-m-d H:i:s') . " (timezone: " . $today->getTimezone()->getName() . ")");

        if ($startDate->format('Y-m-d') < $today->format('Y-m-d') || $endDate->format('Y-m-d') < $today->format('Y-m-d')) {
            throw new \InvalidArgumentException('Las fechas de inicio y fin no pueden ser anteriores a la fecha actual.');
        }
        if ($endDate < $startDate) {
            throw new \InvalidArgumentException('La fecha de fin no puede ser anterior a la fecha de inicio.');
        }

        return $this->warrantyRepository->save($data);
    }

    public function updateWarranty(int $id, array $data): bool
    {
        date_default_timezone_set('UTC');
        // Validation logic for dates (moved from controller)
        $startDate = (new \DateTime($data['start_date']))->setTime(0, 0, 0);
        $endDate = (new \DateTime($data['end_date']))->setTime(0, 0, 0);
        $today = (new \DateTime())->setTime(0, 0, 0);

        error_log("DEBUG: startDate = " . $startDate->format('Y-m-d H:i:s') . " (timezone: " . $startDate->getTimezone()->getName() . ")");
        error_log("DEBUG: endDate = " . $endDate->format('Y-m-d H:i:s') . " (timezone: " . $endDate->getTimezone()->getName() . ")");
        error_log("DEBUG: today = " . $today->format('Y-m-d H:i:s') . " (timezone: " . $today->getTimezone()->getName() . ")");

        if ($startDate->format('Y-m-d') < $today->format('Y-m-d') || $endDate->format('Y-m-d') < $today->format('Y-m-d')) {
            throw new \InvalidArgumentException('Las fechas de inicio y fin no pueden ser anteriores a la fecha actual.');
        }
        if ($endDate < $startDate) {
            throw new \InvalidArgumentException('La fecha de fin no puede ser anterior a la fecha de inicio.');
        }

        // Smart status logic (moved from controller)
        $newStatus = $data['status'];
        if ($data['status'] === 'expirada' && $endDate >= $today) {
            $newStatus = 'activa';
        }
        $data['status'] = $newStatus;

        $data['id'] = $id;
        return $this->warrantyRepository->save($data);
    }

    public function deleteWarranty(int $id): bool
    {
        return $this->warrantyRepository->delete($id);
    }
}
