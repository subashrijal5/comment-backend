<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReactionUpdated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;
    public $data;
    /**
     * Create a new event instance.
     */
    public function __construct($data)
    {
        $this->data = $data;
        //
    }

    public function broadcastOn()
    {
        $channelName = $this->data['commentId']
            ? "blog.{$this->data['blogId']}.comment.{$this->data['commentId']}"
            : "blog.{$this->data['blogId']}";

        return new Channel($channelName);
    }

    public function broadcastWith()
    {
        return [
            'blogId' => $this->data['blogId'],
            'commentId' => $this->data['commentId'],
            'counts' => $this->data['counts'],
        ];
    }
}
