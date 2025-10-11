<?php

namespace Modules\Blog\Database\Seeders;

use Modules\Blog\Models\Blog;
use Modules\Blog\Models\Tag;
use Modules\Blog\Models\Category;
use Illuminate\Database\Seeder;

class BlogSeeder extends Seeder
{
    public function run(): void
    {
        $tags = Tag::factory(10)->create();
        $categories = Category::factory(5)->create();

        Blog::factory(20)
            ->hasComments(3)
            ->create()
            ->each(function ($blog) use ($tags) {
                $blog->tags()->attach($tags->random(rand(2, 4))->pluck('id'));
            });
    }
}
