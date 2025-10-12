<?php

namespace Modules\Blog\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\Blog\Database\Factories\BlogViewFactory;

class BlogView extends Model
{
    use HasFactory;

    protected $fillable = ['blog_id', 'ip_address'];

    public function blog()
    {
        return $this->belongsTo(Blog::class);
    }
}
