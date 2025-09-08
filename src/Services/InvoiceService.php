<?php

namespace App\Services;

use App\Repositories\InvoiceRepository;
use App\Repositories\SaleRepository; // Assuming you have a SaleRepository
use InvalidArgumentException;

class InvoiceService
{
    private $invoiceRepository;
    private $saleRepository; // Inject SaleRepository

    public function __construct(InvoiceRepository $invoiceRepository, SaleRepository $saleRepository)
    {
        $this->invoiceRepository = $invoiceRepository;
        $this->saleRepository = $saleRepository;
    }

    public function generateInvoiceFromSale(int $saleId): array
    {
        $sale = $this->saleRepository->findById($saleId);

        if (!$sale) {
            throw new InvalidArgumentException("Venta con ID {$saleId} no encontrada.");
        }

        // Check if invoice already exists for this sale
        $existingInvoice = $this->invoiceRepository->findBySaleId($saleId);
        if ($existingInvoice) {
            throw new InvalidArgumentException("Ya existe una factura para la venta con ID {$saleId}.");
        }

        // Prepare invoice data
        $invoiceDate = date('Y-m-d');
        $totalAmount = 0;
        $itemsData = [];

        foreach ($sale['items'] as $item) {
            $itemTotal = $item['quantity'] * $item['unit_price'];
            $totalAmount += $itemTotal;
            $itemsData[] = [
                'product_id' => $item['product_id'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'item_total' => $itemTotal
            ];
        }

        $invoiceData = [
            'sale_id' => $saleId,
            'customer_id' => $sale['customer_id'] ?? null,
            'invoice_date' => $invoiceDate,
            'total_amount' => $totalAmount,
            'status' => 'paid'
        ];

        $invoiceId = $this->invoiceRepository->create($invoiceData, $itemsData);
        return $this->invoiceRepository->findById($invoiceId);
    }

    public function getInvoice(int $id): ?array
    {
        return $this->invoiceRepository->findById($id);
    }

    public function updateInvoice(int $id, array $data): bool
    {
        // Basic validation
        if (empty($data['invoice_date']) || empty($data['total_amount'])) {
            throw new InvalidArgumentException("Fecha y monto total son requeridos.");
        }

        // Assuming $data contains invoice details and $data['items'] contains invoice items
        $invoiceData = [
            'customer_id' => $data['customer_id'] ?? null,
            'invoice_date' => $data['invoice_date'],
            'total_amount' => $data['total_amount'],
            'status' => $data['status'] ?? 'unpaid'
        ];
        $itemsData = $data['items'] ?? [];

        return $this->invoiceRepository->update($id, $invoiceData, $itemsData);
    }

    public function deleteInvoice(int $id): bool
    {
        return $this->invoiceRepository->delete($id);
    }

    public function getAllInvoices(int $page, int $limit, array $filters): array
    {
        $offset = ($page - 1) * $limit;
        $result = $this->invoiceRepository->getAll($limit, $offset, $filters);
        
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

    // Method to generate PDF (will be implemented in Controller or a dedicated PDF service)
    // public function generateInvoicePdf(int $invoiceId): string
    // {
    //     $invoice = $this->getInvoice($invoiceId);
    //     if (!$invoice) {
    //         throw new InvalidArgumentException("Factura con ID {$invoiceId} no encontrada.");
    //     }
    //     // Logic to render HTML and generate PDF using dompdf
    //     // This might be better in a dedicated PDF service or directly in the controller
    // }
}