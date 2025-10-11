<?php

namespace Modules\Blog\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Blog\Database\Factories\BlogFactory;

use Modules\Blog\Models\Category;
use Modules\Blog\Models\Tag;
use Modules\Blog\Models\Comment;
use Modules\Blog\Models\BlogVote;
use Modules\Blog\Models\BlogView;

class Blog extends Model
{
    use HasFactory;

    protected static function newFactory()
    {
        return BlogFactory::new();
    }

    protected $fillable = [
        'title',
        'slug',
        'excerpt',
        'content',
        'thumbnail',
        'category_id',
        'views',
        'upvotes',
        'downvotes',
        'author_id',
        'published_at',
    ];

    protected $dates = ['published_at'];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'blog_tag');
    }

    public function comments()
    {
        return $this->hasMany(Comment::class)->whereNull('parent_id')->orderBy('created_at', 'desc');
    }

    public function votes()
    {
        return $this->hasMany(BlogVote::class);
    }

    public function viewsRecords()
    {
        return $this->hasMany(BlogView::class);
    }
}
