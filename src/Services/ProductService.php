<?php

namespace App\Services;

use App\Repositories\ProductRepository;
use Psr\Http\Message\UploadedFileInterface;

class ProductService
{
    private $productRepository;

    public function __construct(ProductRepository $productRepository)
    {
        $this->productRepository = $productRepository;
    }

    public function getAllProducts(array $filters, int $page, int $limit): array
    {
        $offset = ($page - 1) * $limit;
        $result = $this->productRepository->findAllPaginated($filters, $limit, $offset);
        
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

    public function createProduct(array $data): bool
    {
        return $this->productRepository->save($data);
    }

    public function updateProduct(int $id, array $data): bool
    {
        $data['id'] = $id;
        return $this->productRepository->save($data);
    }

    public function deleteProduct(int $id): bool
    {
        return $this->productRepository->delete($id);
    }

    public function getLowStockProducts(): array
    {
        return $this->productRepository->findLowStock();
    }

    public function uploadProductImage(int $id, UploadedFileInterface $uploadedFile): string
    {
        $directory = __DIR__ . '/../../public/uploads';
        if (!is_dir($directory)) {
            mkdir($directory, 0777, true);
        }

        if ($uploadedFile->getError() !== UPLOAD_ERR_OK) {
            throw new \RuntimeException('Error al subir la imagen.');
        }

        $filename = uniqid() . '-' . $uploadedFile->getClientFilename();
        $path = $directory . DIRECTORY_SEPARATOR . $filename;
        $uploadedFile->moveTo($path);

        $dbPath = 'uploads/' . $filename;
        $this->productRepository->updateImagePath($id, $dbPath);

        return $dbPath;
    }
}
