<?php

namespace Modules\Blog\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\Blog\Database\Factories\BlogVoteFactory;

class BlogVote extends Model
{
    use HasFactory;

    protected $fillable = ['blog_id', 'ip_address', 'vote_type'];

    public function blog()
    {
        return $this->belongsTo(Blog::class);
    }
}
