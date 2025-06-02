<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reaction extends Model
{
    protected $fillable = [
        'blog_id',
        'comment_id',
        'visitor_id',
        'type',
    ];

    public function blog()
    {
        return $this->belongsTo(Blog::class);
    }

    public function comment()
    {
        return $this->belongsTo(Comment::class);
    }
}
