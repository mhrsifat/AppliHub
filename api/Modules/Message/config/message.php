<?php

return [
    'staff_roles' => ['admin', 'employee', 'manager'],
    
    // Conversation settings
    'conversation' => [
        'max_attachment_size' => 10240, // 10MB in KB
        'allowed_mime_types' => [
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
    ],
];