<?php

namespace Modules\Blog\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Blog\Models\Tag;
use Illuminate\Http\Request;

class TagController extends Controller
{
    public function index()
    {
        return \Modules\Blog\Transformers\TagResource::collection(Tag::all());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|unique:tags,name',
            'slug' => 'nullable|string|unique:tags,slug',
        ]);

        $tag = Tag::create($data);
        return new \Modules\Blog\Transformers\TagResource($tag);
    }
}
