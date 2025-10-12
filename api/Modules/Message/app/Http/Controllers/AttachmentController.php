<?php

namespace Modules\Message\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\Message\Models\Attachment;
use Illuminate\Support\Facades\Storage;

class AttachmentController extends Controller
{
    public function store(Request $request, $conversation)
    {
        // This endpoint accepts attachments prior to message send (optional)
        // but we'll just handle direct message attachments in MessageController.store
        return response()->json(['error' => 'Use message attachments route'], 400);
    }

    public function show($id)
    {
        $attachment = Attachment::findOrFail($id);
        return response()->json([
            'url' => Storage::disk('public')->url($attachment->path),
            'filename' => $attachment->filename,
            'mime' => $attachment->mime,
            'size' => $attachment->size,
        ]);
    }
}
