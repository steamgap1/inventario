<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use PDO;

class ProductController
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getAll(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        
        if ($user['role'] === 'admin') {
            $sql = "SELECT p.*, pr.name as provider_name FROM products p LEFT JOIN providers pr ON p.provider_id = pr.id WHERE p.is_active = 1";
            $stmt = $this->pdo->query($sql);
        } else {
            $priceColumn = 'price_client'; // Default price for 'cliente' role
            if ($user['role'] === 'vendedor') {
                $priceColumn = 'price_wholesale';
            }

            $sql = "SELECT p.id, p.name, p.description, p.stock, p.condition, p.image_path, {$priceColumn} as price, pr.name as provider_name 
                    FROM products p LEFT JOIN providers pr ON p.provider_id = pr.id WHERE p.is_active = 1";
            $stmt = $this->pdo->query($sql);
        }

        $products = $stmt->fetchAll();
        $response->getBody()->write(json_encode(['status' => 'success', 'data' => $products]));
        return $response;
    }

    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $sql = "INSERT INTO products (name, description, stock, `condition`, cost, price_client, price_wholesale, price_technician, provider_id, entry_date, warranty_expires_on) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $this->pdo->prepare($sql);
        
        $provider_id = !empty($data['provider_id']) ? $data['provider_id'] : null;
        $entry_date = !empty($data['entry_date']) ? $data['entry_date'] : null;
        $warranty_expires_on = !empty($data['warranty_expires_on']) ? $data['warranty_expires_on'] : null;

        $stmt->execute([
            $data['name'], $data['description'], $data['stock'], $data['condition'], 
            $data['cost'], $data['price_client'], $data['price_wholesale'], $data['price_technician'],
            $provider_id, $entry_date, $warranty_expires_on
        ]);
        
        $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Producto creado']));
        return $response->withStatus(201);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $data = $request->getParsedBody();
        $sql = "UPDATE products SET name=?, description=?, stock=?, `condition`=?, cost=?, price_client=?, price_wholesale=?, price_technician=?, provider_id=?, entry_date=?, warranty_expires_on=?
                WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);

        $provider_id = !empty($data['provider_id']) ? $data['provider_id'] : null;
        $entry_date = !empty($data['entry_date']) ? $data['entry_date'] : null;
        $warranty_expires_on = !empty($data['warranty_expires_on']) ? $data['warranty_expires_on'] : null;

        $stmt->execute([
            $data['name'], $data['description'], $data['stock'], $data['condition'], 
            $data['cost'], $data['price_client'], $data['price_wholesale'], $data['price_technician'],
            $provider_id, $entry_date, $warranty_expires_on, $args['id']
        ]);

        $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Producto actualizado']));
        return $response;
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $stmt = $this->pdo->prepare("UPDATE products SET is_active = 0 WHERE id = ?");
        $stmt->execute([$args['id']]);
        $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Producto desactivado']));
        return $response;
    }

    public function uploadImage(Request $request, Response $response, array $args): Response
    {
        $directory = __DIR__ . '/../../public/uploads';
        $uploadedFiles = $request->getUploadedFiles();
        $uploadedFile = $uploadedFiles['image'];

        if ($uploadedFile->getError() === UPLOAD_ERR_OK) {
            $filename = uniqid() . '-' . $uploadedFile->getClientFilename();
            $path = $directory . DIRECTORY_SEPARATOR . $filename;
            $uploadedFile->moveTo($path);

            $stmt = $this->pdo->prepare("UPDATE products SET image_path = ? WHERE id = ?");
            $stmt->execute(['uploads/' . $filename, $args['id']]);

            $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Imagen subida']));
            return $response;
        }

        $response->getBody()->write(json_encode(['status' => 'error', 'message' => 'Error al subir la imagen']));
        return $response->withStatus(500);
    }
}