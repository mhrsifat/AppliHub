<?php

namespace Modules\Blog\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Blog\Http\Requests\StoreBlogRequest;
use Modules\Blog\Http\Requests\CommentRequest;
use Modules\Blog\Transformers\BlogResource;
use Modules\Blog\Models\Blog;
use Modules\Blog\Models\BlogVote;
use Modules\Blog\Models\BlogView;
use Modules\Blog\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Carbon\Carbon;

class BlogController extends Controller
{
    public function index(Request $request)
    {
        $query = Blog::with(['category', 'tags']);

        if ($request->has('category')) {
            $query->whereHas('category', function ($q) use ($request) {
                $q->where('slug', $request->get('category'));
            });
        }

        if ($request->has('tag')) {
            $query->whereHas('tags', function ($q) use ($request) {
                $q->where('slug', $request->get('tag'));
            });
        }

        $perPage = $request->get('per_page', 12);

        $blogs = $query->orderBy('published_at', 'desc')->paginate($perPage);

        return \Modules\Blog\Transformers\BlogResource::collection($blogs);
    }

    public function show(Request $request, $slug)
    {
        $blog = Blog::with(['category', 'tags', 'comments.replies'])->where('slug', $slug)->firstOrFail();

        // handle view counting: one view per IP per 24 hours
        $ip = $request->ip();
        $lastView = BlogView::where('blog_id', $blog->id)->where('ip_address', $ip)->latest()->first();

        if (!$lastView || $lastView->created_at->lt(Carbon::now()->subHours(24))) {
            BlogView::create([
                'blog_id' => $blog->id,
                'ip_address' => $ip,
            ]);
            $blog->increment('views');
        }

        return new BlogResource($blog);
    }

    public function store(StoreBlogRequest $request)
    {
        $data = $request->validated();

        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['title']);
            // ensure uniqueness
            $base = $data['slug'];
            $i = 1;
            while (Blog::where('slug', $data['slug'])->exists()) {
                $data['slug'] = $base . '-' . $i++;
            }
        }

        $blog = Blog::create($data);

        if (!empty($data['tags'])) {
            $blog->tags()->sync($data['tags']);
        }

        return new BlogResource($blog);
    }

    public function update(StoreBlogRequest $request, Blog $blog)
    {
        $data = $request->validated();

        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['title']);
            $base = $data['slug'];
            $i = 1;
            while (Blog::where('slug', $data['slug'])->where('id', '!=', $blog->id)->exists()) {
                $data['slug'] = $base . '-' . $i++;
            }
        }

        $blog->update($data);

        if (isset($data['tags'])) {
            $blog->tags()->sync($data['tags']);
        }

        return new BlogResource($blog);
    }

    public function vote(Request $request, $id)
    {
        $request->validate([
            'vote' => 'required|in:up,down'
        ]);

        $ip = $request->ip();
        $voteType = $request->get('vote');

        $blog = Blog::findOrFail($id);

        $existing = BlogVote::where('blog_id', $blog->id)->where('ip_address', $ip)->first();

        if (!$existing) {
            // create
            BlogVote::create([
                'blog_id' => $blog->id,
                'ip_address' => $ip,
                'vote_type' => $voteType
            ]);
            if ($voteType === 'up') $blog->increment('upvotes');
            else $blog->increment('downvotes');
        } else {
            if ($existing->vote_type === $voteType) {
                // toggle off: remove vote
                if ($voteType === 'up') $blog->decrement('upvotes');
                else $blog->decrement('downvotes');
                $existing->delete();
            } else {
                // change vote
                if ($voteType === 'up') {
                    $blog->increment('upvotes');
                    $blog->decrement('downvotes');
                } else {
                    $blog->increment('downvotes');
                    $blog->decrement('upvotes');
                }
                $existing->update(['vote_type' => $voteType]);
            }
        }

        return response()->json([
            'upvotes' => $blog->fresh()->upvotes,
            'downvotes' => $blog->fresh()->downvotes,
        ]);
    }

    public function comment(CommentRequest $request)
    {
        $data = $request->validated();
        $ip = $request->ip();

        $comment = Comment::create(array_merge($data, [
            'ip_address' => $ip,
            'is_admin_reply' => false,
        ]));

        return new \Modules\Blog\Transformers\CommentResource($comment);
    }

    public function reply(CommentRequest $request, $id)
    {
        // $id = blog id
        $data = $request->validated();
        $ip = $request->ip();

        $comment = Comment::create(array_merge($data, [
            'ip_address' => $ip,
            'is_admin_reply' => false,
        ]));

        return new \Modules\Blog\Transformers\CommentResource($comment);
    }

    public function adminReply(Request $request, $id)
    {
        // admin replies: $id = comment id
        $request->validate(['comment_text' => 'required|string|max:2000']);

        $comment = Comment::findOrFail($id);

        $reply = Comment::create([
            'blog_id' => $comment->blog_id,
            'parent_id' => $comment->id,
            'user_name' => 'Admin',
            'comment_text' => $request->get('comment_text'),
            'ip_address' => $request->ip(),
            'is_admin_reply' => true,
        ]);

        return new \Modules\Blog\Transformers\CommentResource($reply);
    }
}
