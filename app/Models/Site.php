<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Site extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'domain',
        'token',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function blogs()
    {
        return $this->hasMany(Blog::class);
    }

    public static function boot()
    {
        parent::boot();

        static::creating(function ($site) {
            $secret = config('app.token_secret');
            $site->token = hash('sha256', $secret . $site->domain);
        });
    }
}
