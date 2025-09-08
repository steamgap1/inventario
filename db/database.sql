-- Base de datos: `almacontrol`
DROP DATABASE IF EXISTS `almacontrol`;
CREATE DATABASE `almacontrol` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `almacontrol`;

-- --------------------------------------------------------

--
-- Estructura de la tabla `providers`
--
CREATE TABLE `providers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `contact_person` VARCHAR(100) NULL,
  `phone` VARCHAR(50) NULL,
  `email` VARCHAR(100) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `providers`
--
INSERT INTO `providers` (`name`, `contact_person`, `phone`, `email`) VALUES
('TechDistributors Inc.', 'Juan Pérez', '555-1234', 'juan.perez@techdist.com'),
('Componentes Globales', 'Maria Garcia', '555-5678', 'mgarcia@componentesglobales.com');

-- --------------------------------------------------------

--
-- Estructura de la tabla `users`
--
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'vendedor', 'cliente') NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `users`
-- Contraseña para todos es "password123"
--
INSERT INTO `users` (`username`, `password_hash`, `role`) VALUES
('admin', '$2y$10$E.qL2h3b1j9E/1Z3g8D0a.Cj.R.gY7.X/C.e1/2b.Z/3f4g5h6i7', 'admin'),
('vendedor', '$2y$10$E.qL2h3b1j9E/1Z3g8D0a.Cj.R.gY7.X/C.e1/2b.Z/3f4g5h6i7', 'vendedor'),
('cliente', '$2y$10$E.qL2h3b1j9E/1Z3g8D0a.Cj.R.gY7.X/C.e1/2b.Z/3f4g5h6i7', 'cliente');

-- --------------------------------------------------------

--
-- Estructura de la tabla `products`
--
CREATE TABLE `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `stock` INT NOT NULL DEFAULT 0,
  `condition` ENUM('nuevo', 'usado') NOT NULL DEFAULT 'nuevo',
  `cost` DECIMAL(10, 2) DEFAULT 0.00,
  `price_client` DECIMAL(10, 2) DEFAULT 0.00,
  `price_wholesale` DECIMAL(10, 2) DEFAULT 0.00,
  `price_technician` DECIMAL(10, 2) DEFAULT 0.00,
  `provider_id` INT NULL,
  `entry_date` DATE NULL,
  `warranty_expires_on` DATE NULL,
  `image_path` VARCHAR(255) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `products`
--
INSERT INTO `products` (`name`, `description`, `stock`, `condition`, `cost`, `price_client`, `price_wholesale`, `price_technician`, `provider_id`, `entry_date`, `warranty_expires_on`) VALUES
('Laptop Pro 15"', 'Laptop de alto rendimiento con 16GB RAM y 512GB SSD.', 25, 'nuevo', 950.00, 1200.00, 1100.00, 1050.00, 1, '2025-08-01', '2026-08-01'),
('Mouse Inalámbrico Ergo', 'Mouse ergonómico con 6 botones programables.', 150, 'nuevo', 30.00, 45.00, 40.00, 35.00, 2, '2025-08-05', '2026-02-05'),
('Teclado Mecánico RGB (Usado)', 'Teclado para gaming con switches rojos. Buen estado.', 1, 'usado', 40.00, 65.00, 55.00, 50.00, NULL, '2025-08-10', NULL),
('Monitor 4K 27"', 'Monitor UHD para diseño gráfico y gaming.', 40, 'nuevo', 380.00, 450.00, 420.00, 400.00, 1, '2025-07-20', '2027-07-20');

-- --------------------------------------------------------

--
-- Estructura de la tabla `warranties` (Garantías de venta a clientes)
--
CREATE TABLE `warranties` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `notes` TEXT,
  `status` ENUM('activa', 'expirada', 'utilizada') NOT NULL DEFAULT 'activa',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `warranties`
--
INSERT INTO `warranties` (`product_id`, `start_date`, `end_date`, `notes`, `status`) VALUES
(1, '2025-08-15', '2026-08-14', 'Garantía de 1 año para cliente final.', 'activa');

-- --------------------------------------------------------

--
-- Estructura de la tabla `customers`
--
CREATE TABLE `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `identification` VARCHAR(50) NULL,
  `phone` VARCHAR(50) NULL,
  `email` VARCHAR(100) NULL,
  `address` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de la tabla `sales`
--
CREATE TABLE `sales` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NULL,
  `sale_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `total_amount` DECIMAL(10, 2) NOT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Estructura de la tabla `sale_items`
--
CREATE TABLE `sale_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sale_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `quantity` INT NOT NULL,
  `unit_price` DECIMAL(10, 2) NOT NULL,
  `item_total` DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `sales`
--
INSERT INTO `sales` (`product_id`, `quantity`, `sale_price`, `customer_name`, `notes`) VALUES
(1, 1, 1200.00, 'Cliente Ejemplo', 'Venta inicial de laptop.'),
(2, 5, 45.00, 'Tienda XYZ', 'Venta al por mayor de mouses.');

-- --------------------------------------------------------

--
-- Estructura de la tabla `quotes`
--
CREATE TABLE `quotes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_email` VARCHAR(255) NULL,
  `customer_phone` VARCHAR(50) NULL,
  `quote_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `valid_until` DATE NULL,
  `total_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `notes` TEXT NULL,
  `status` ENUM('draft', 'sent', 'accepted', 'rejected', 'converted_to_sale') NOT NULL DEFAULT 'draft',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de la tabla `quote_items`
--
CREATE TABLE `quote_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `quote_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `quantity` INT NOT NULL,
  `unit_price` DECIMAL(10, 2) NOT NULL,
  `item_total` DECIMAL(10, 2) NOT NULL,
  `notes` TEXT NULL,
  FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de la tabla `invoices`
--
CREATE TABLE `invoices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sale_id` INT NOT NULL UNIQUE, -- One invoice per sale
  `invoice_number` VARCHAR(50) NOT NULL UNIQUE,
  `invoice_date` DATE NOT NULL,
  `total_amount` DECIMAL(10, 2) NOT NULL,
  `details` JSON NULL, -- To store product details, quantities, prices at the time of invoicing
  `status` ENUM('draft', 'finalized', 'cancelled') NOT NULL DEFAULT 'draft',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de la tabla `invoice_items` (Optional, but good for detailed invoices)
--
CREATE TABLE `invoice_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_id` INT NOT NULL,
  `product_id` INT NULL, -- Can be NULL if product was deleted or custom item
  `description` VARCHAR(255) NOT NULL,
  `quantity` INT NOT NULL,
  `unit_price` DECIMAL(10, 2) NOT NULL,
  `item_total` DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
