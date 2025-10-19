<?php

namespace Modules\Blog\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Modules\Blog\Models\Blog;
use Modules\Blog\Models\BlogVote;
use Modules\Blog\Models\BlogView;
use Modules\Blog\Models\Comment;
use Modules\Blog\Http\Requests\StoreBlogRequest;
use Modules\Blog\Http\Requests\CommentRequest;
use Modules\Blog\Transformers\BlogResource;
use Modules\Blog\Transformers\CommentResource;

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

        $perPage = (int) $request->get('per_page', 12);

        $blogs = $query->orderBy('published_at', 'desc')->paginate($perPage);

        return BlogResource::collection($blogs);
    }

    public function show(Request $request, $slug)
    {
        $blog = Blog::with(['category', 'tags', 'comments.replies'])->where('slug', $slug)->firstOrFail();

        // View counting with Cache (ক্যাশ) to reduce DB hits.
        $ip = $request->ip();
        $cacheKey = sprintf('blog:view:%d:ip:%s', $blog->id, $ip); // key per blog+ip
        // TTL 24 hours = 1440 minutes
        if (!Cache::has($cacheKey)) {
            Cache::put($cacheKey, true, 1440);

            // create BlogView record for analytics (optional)
            try {
                BlogView::create([
                    'blog_id' => $blog->id,
                    'ip_address' => $ip,
                ]);
            } catch (\Throwable $e) {
                // swallow analytics failures; view count is more important
            }

            // increment view counter (atomic)
            $blog->increment('views');
        }

        return new BlogResource($blog);
    }

public function store(StoreBlogRequest $request)
{
    $data = $request->validated();

    // Handle category creation or linking
    if (!empty($data['category_name'])) {
        $category = \Modules\Blog\Models\Category::firstOrCreate(
            ['name' => $data['category_name']],
            ['slug' => \Illuminate\Support\Str::slug($data['category_name'])]
        );
        $data['category_id'] = $category->id;
    }

    // Create slug if missing
    if (empty($data['slug'])) {
        $base = \Illuminate\Support\Str::slug($data['title']);
        $slug = $base;
        $i = 1;
        while (\Modules\Blog\Models\Blog::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }
        $data['slug'] = $slug;
    }

    // Create Blog
    $blog = \Modules\Blog\Models\Blog::create($data);

    // Handle tags creation or linking
    if (!empty($data['tags'])) {
        $tagIds = [];
        foreach ($data['tags'] as $tagName) {
            $tag = \Modules\Blog\Models\Tag::firstOrCreate(
                ['name' => $tagName],
                ['slug' => \Illuminate\Support\Str::slug($tagName)]
            );
            $tagIds[] = $tag->id;
        }
        $blog->tags()->sync($tagIds);
    }

    return new \Modules\Blog\Transformers\BlogResource($blog->load(['category', 'tags']));
}

public function update(StoreBlogRequest $request, Blog $blog)
{
    $data = $request->validated();

    // Handle category_name if provided (create or link)
    if (!empty($data['category_name'])) {
        $category = \Modules\Blog\Models\Category::firstOrCreate(
            ['name' => $data['category_name']],
            ['slug' => \Illuminate\Support\Str::slug($data['category_name'])]
        );
        $data['category_id'] = $category->id;
    }

    // If category_id provided directly (and no category_name), keep it as is.
    // Create slug if missing, ensure uniqueness (avoid conflict with other blogs)
    if (empty($data['slug'])) {
        $base = \Illuminate\Support\Str::slug($data['title']);
        $slug = $base;
        $i = 1;
        while (\Modules\Blog\Models\Blog::where('slug', $slug)->where('id', '!=', $blog->id)->exists()) {
            $slug = $base . '-' . $i++;
        }
        $data['slug'] = $slug;
    } else {
        // if slug provided, make sure it's unique (except current blog)
        $provided = \Illuminate\Support\Str::slug($data['slug']);
        if ( \Modules\Blog\Models\Blog::where('slug', $provided)->where('id', '!=', $blog->id)->exists() ) {
            $base = $provided;
            $slug = $base;
            $i = 1;
            while (\Modules\Blog\Models\Blog::where('slug', $slug)->where('id', '!=', $blog->id)->exists()) {
                $slug = $base . '-' . $i++;
            }
            $data['slug'] = $slug;
        } else {
            $data['slug'] = $provided;
        }
    }

    // Update blog basic fields
    $blog->update($data);

    // Handle tags: accept either array of tag IDs or array of tag names.
    // Example accepted payloads:
    // "tags": [1,2,3]  OR  "tags": ["Laravel","React"]
    if (isset($data['tags']) && is_array($data['tags'])) {
        $tagIds = [];
        foreach ($data['tags'] as $tagItem) {
            // numeric (id) -> attach directly if exists
            if (is_int($tagItem) || ctype_digit((string)$tagItem)) {
                $exists = \Modules\Blog\Models\Tag::find((int)$tagItem);
                if ($exists) $tagIds[] = $exists->id;
                // if id doesn't exist, skip silently (or you can choose to throw validation error)
            } else {
                // treat as name -> firstOrCreate by name
                $tagName = (string) $tagItem;
                $tag = \Modules\Blog\Models\Tag::firstOrCreate(
                    ['name' => $tagName],
                    ['slug' => \Illuminate\Support\Str::slug($tagName)]
                );
                $tagIds[] = $tag->id;
            }
        }

        // Finally sync tags
        $blog->tags()->sync($tagIds);
    }

    // reload relations for response
    $blog->load(['category', 'tags']);

    return new \Modules\Blog\Transformers\BlogResource($blog);
}
    

    public function vote(Request $request, $id)
    {
        $request->validate([
            'vote' => 'required|in:up,down'
        ]);

        $ip = $request->ip();
        $voteType = $request->get('vote');

        // Use transaction + row lock to avoid concurrency issues.
        $result = DB::transaction(function () use ($id, $ip, $voteType) {
            // Lock the blog row for update
            $blog = Blog::where('id', $id)->lockForUpdate()->firstOrFail();

            $existing = BlogVote::where('blog_id', $blog->id)
                ->where('ip_address', $ip)
                ->first();

            if (!$existing) {
                // create new vote
                BlogVote::create([
                    'blog_id' => $blog->id,
                    'ip_address' => $ip,
                    'vote_type' => $voteType
                ]);

                if ($voteType === 'up') {
                    $blog->increment('upvotes');
                } else {
                    $blog->increment('downvotes');
                }
            } else {
                if ($existing->vote_type === $voteType) {
                    // toggle off: remove vote
                    if ($voteType === 'up') {
                        // ensure not negative
                        if ($blog->upvotes > 0) $blog->decrement('upvotes');
                    } else {
                        if ($blog->downvotes > 0) $blog->decrement('downvotes');
                    }
                    $existing->delete();
                } else {
                    // change vote
                    if ($voteType === 'up') {
                        if ($blog->downvotes > 0) $blog->decrement('downvotes');
                        $blog->increment('upvotes');
                    } else {
                        if ($blog->upvotes > 0) $blog->decrement('upvotes');
                        $blog->increment('downvotes');
                    }
                    $existing->update(['vote_type' => $voteType]);
                }
            }

            // return fresh counts
            $blog->refresh();

            return [
                'upvotes' => $blog->upvotes,
                'downvotes' => $blog->downvotes,
            ];
        });

        return response()->json($result);
    }

    public function comment(CommentRequest $request)
    {
        $data = $request->validated();
        $ip = $request->ip();

        $comment = Comment::create(array_merge($data, [
            'ip_address' => $ip,
            'is_admin_reply' => false,
        ]));

        return new CommentResource($comment);
    }

    /**
     * Reply to an existing comment.
     *
     * @param CommentRequest $request
     * @param int $commentId  // parent comment id
     */
    public function reply(CommentRequest $request, $commentId)
    {
        $data = $request->validated();
        $ip = $request->ip();

        $parent = Comment::findOrFail($commentId);

        $comment = Comment::create(array_merge($data, [
            'blog_id' => $parent->blog_id,
            'parent_id' => $parent->id,
            'ip_address' => $ip,
            'is_admin_reply' => false,
        ]));

        return new CommentResource($comment);
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

        return new CommentResource($reply);
    }
}