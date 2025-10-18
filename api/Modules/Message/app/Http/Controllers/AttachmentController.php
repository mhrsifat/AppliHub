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
    
    
public function destroy(Request $request, $id)
{
    $user = $request->user();
    if (!$user) {
        return response()->json(['error' => 'Unauthorized'], 401);
    }

    $attachment = \Modules\Message\Models\Attachment::findOrFail($id);

    // Optional: check if staff owns conversation
    $conversation = $attachment->conversation;
    if ($conversation && $conversation->assigned_to && $conversation->assigned_to !== $user->id) {
        return response()->json(['error' => 'Forbidden'], 403);
    }

    // Delete file from storage
    if (\Storage::disk('public')->exists($attachment->path)) {
        \Storage::disk('public')->delete($attachment->path);
    }

    $attachment->delete();

    return response()->json(['ok' => true, 'message' => 'Attachment deleted.']);
}
}