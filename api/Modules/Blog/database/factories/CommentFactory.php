<?php

namespace Modules\Blog\Database\Factories;

use Modules\Blog\Models\Blog;
use Illuminate\Database\Eloquent\Factories\Factory;

class CommentFactory extends Factory
{
    protected $model = \Modules\Blog\Models\Comment::class;

    public function definition(): array
    {
        return [
            'blog_id' => Blog::factory(),
            'parent_id' => null,
            'user_name' => $this->faker->name(),
            'comment_text' => $this->faker->sentence(15),
            'ip_address' => $this->faker->ipv4(),
            'is_admin_reply' => false,
        ];
    }

    public function adminReply()
    {
        return $this->state(fn() => [
            'is_admin_reply' => true,
            'user_name' => 'Admin',
        ]);
    }
}
