<?php

namespace Modules\Blog\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Blog\Models\Category;
use Modules\Blog\Models\Tag;
use Modules\Blog\Models\Blog;
use Illuminate\Support\Str;

class BlogModuleSeeder extends Seeder
{
    public function run()
    {
        $cat = Category::create(['name' => 'General', 'slug' => 'general', 'description' => 'General posts']);
        $tags = collect(['laravel','php','react','tips'])->map(function($t){
            return Tag::create(['name' => ucfirst($t), 'slug' => $t]);
        });

        $blog = Blog::create([
            'title' => 'First Sample Blog',
            'slug' => 'first-sample-blog',
            'excerpt' => 'This is a sample excerpt for the first blog.',
            'content' => '<p>Hello world</p>',
            'category_id' => $cat->id,
            'published_at' => now(),
        ]);

        $blog->tags()->sync($tags->pluck('id')->toArray());
    }
}
