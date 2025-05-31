<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

class Site extends Model
{
    use HasApiTokens;
    protected $fillable = [
        'user_id',
        'name',
        'domain',
        'client_id',
        'client_secret',
    ];

    protected $hidden = [
        'client_secret',
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
            $site->client_id = Str::uuid();
            $site->client_secret = hash('sha256', $secret . $site->client_id . $site->domain);
        });
    }
}
