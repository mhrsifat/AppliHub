<?php

namespace Modules\Blog\Database\Factories;

use Modules\Blog\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class BlogFactory extends Factory
{
    protected $model = \Modules\Blog\Models\Blog::class;

    public function definition(): array
    {
        $title = $this->faker->unique()->sentence(6);
        $content = $this->faker->paragraphs(5, true);

        return [
            'title' => $title,
            'slug' => Str::slug($title),
            'excerpt' => $this->faker->sentence(20),
            'content' => $content,
            'thumbnail' => 'https://picsum.photos/400/240?random=' . $this->faker->randomNumber(),
            'category_id' => Category::factory(),
            'views' => $this->faker->numberBetween(0, 5000),
            'upvotes' => $this->faker->numberBetween(0, 200),
            'downvotes' => $this->faker->numberBetween(0, 100),
            'author_id' => null, 
            'published_at' => now()->subDays(rand(1, 90)),
        ];
    }
}