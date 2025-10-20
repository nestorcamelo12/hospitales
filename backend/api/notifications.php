<?php

use App\Db;
use App\Helpers;
use App\AuthMiddleware;

// GET /api/notifications - Obtener notificaciones del usuario
function handleGetNotifications(): void
{
    $user = AuthMiddleware::authenticate();
    $db = Db::getInstance();

    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = max(1, min(100, (int)($_GET['per_page'] ?? 20)));
    $unreadOnly = isset($_GET['unread_only']) && $_GET['unread_only'] === '1';

    $whereConditions = ["user_id = :user_id"];
    $params = [':user_id' => (int)$user->id];

    if ($unreadOnly) {
        $whereConditions[] = "leido = 0";
    }

    $whereClause = 'WHERE ' . implode(' AND ', $whereConditions);

    // Contar total
    $countSql = "SELECT COUNT(*) as total FROM notifications {$whereClause}";
    $stmt = $db->prepare($countSql);
    $stmt->execute($params);
    $total = (int)$stmt->fetch()['total'];

    // Obtener notificaciones
    $offset = ($page - 1) * $perPage;
    $sql = "SELECT * FROM notifications {$whereClause} ORDER BY created_at DESC LIMIT :limit OFFSET :offset";

    $stmt = $db->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $notifications = $stmt->fetchAll();

    // Contar no leídas
    $stmtUnread = $db->prepare("SELECT COUNT(*) as total FROM notifications WHERE user_id = :user_id AND leido = 0");
    $stmtUnread->execute([':user_id' => (int)$user->id]);
    $unreadCount = (int)$stmtUnread->fetch()['total'];

    Helpers::jsonResponse([
        'status' => 'success',
        'data' => $notifications,
        'pagination' => [
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => ceil($total / $perPage)
        ],
        'unread_count' => $unreadCount
    ]);
}

// PUT /api/notifications/:id/read - Marcar como leída
function handleMarkNotificationAsRead(int $id): void
{
    $user = AuthMiddleware::authenticate();
    $db = Db::getInstance();

    $stmt = $db->prepare("
        UPDATE notifications 
        SET leido = 1, leido_at = NOW() 
        WHERE id = :id AND user_id = :user_id
    ");

    $stmt->execute([
        ':id' => $id,
        ':user_id' => (int)$user->id
    ]);

    if ($stmt->rowCount() === 0) {
        Helpers::errorResponse('Notificación no encontrada', 404);
    }

    Helpers::jsonResponse([
        'status' => 'success',
        'message' => 'Notificación marcada como leída'
    ]);
}

// PUT /api/notifications/mark-all-read - Marcar todas como leídas
function handleMarkAllNotificationsAsRead(): void
{
    $user = AuthMiddleware::authenticate();
    $db = Db::getInstance();

    $stmt = $db->prepare("
        UPDATE notifications 
        SET leido = 1, leido_at = NOW() 
        WHERE user_id = :user_id AND leido = 0
    ");

    $stmt->execute([':user_id' => (int)$user->id]);

    Helpers::jsonResponse([
        'status' => 'success',
        'message' => 'Todas las notificaciones marcadas como leídas',
        'count' => $stmt->rowCount()
    ]);
}
