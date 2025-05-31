<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    protected $fillable = [
        'blog_id',
        'parent_id',
        'name',
        'email',
        'body',
    ];

    public function blog()
    {
        return $this->belongsTo(Blog::class);
    }

    public function parent()
    {
        return $this->belongsTo(Comment::class, 'parent_id');
    }
}
