<?php

// hash-password.php
if (isset($argv[1])) {
    $password = $argv[1];
    $hash = password_hash($password, PASSWORD_DEFAULT);
    echo "Password: " . $password . "\n";
    echo "Hashed: " . $hash . "\n";
} else {
    echo "Uso: php hash-password.php <su_password>\n";
}

