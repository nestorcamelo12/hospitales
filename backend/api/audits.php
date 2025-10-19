<?php

use App\Db;
use App\Helpers;
use App\AuthMiddleware;

// Solo administradores
AuthMiddleware::requireAdmin();

$db = Db::getInstance();

// Parámetros
$limit = min(100, max(1, (int)($_GET['limit'] ?? 50)));
$entity = $_GET['entity'] ?? '';

$sql = "
    SELECT a.id, a.user_id, a.action, a.entity, a.entity_id, 
           a.details, a.ip_address, a.created_at,
           u.name as user_name, u.email as user_email
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
";

$params = [];

if ($entity) {
    $sql .= " WHERE a.entity = :entity";
    $params[':entity'] = $entity;
}

$sql .= " ORDER BY a.created_at DESC LIMIT :limit";

$stmt = $db->prepare($sql);
foreach ($params as $key => $value) {
    $stmt->bindValue($key, $value);
}
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->execute();

$audits = $stmt->fetchAll();

$data = array_map(function($a) {
    return [
        'id' => (int)$a['id'],
        'user_id' => $a['user_id'] ? (int)$a['user_id'] : null,
        'user_name' => $a['user_name'],
        'user_email' => $a['user_email'],
        'action' => $a['action'],
        'entity' => $a['entity'],
        'entity_id' => $a['entity_id'] ? (int)$a['entity_id'] : null,
        'details' => $a['details'] ? json_decode($a['details'], true) : null,
        'ip_address' => $a['ip_address'],
        'created_at' => $a['created_at']
    ];
}, $audits);

Helpers::jsonResponse($data);


