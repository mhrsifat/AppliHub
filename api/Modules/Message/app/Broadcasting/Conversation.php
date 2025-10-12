<?php

namespace Modules\Message\Broadcasting;

class Conversation
{
    /**
     * Create a new channel instance.
     */
    public function __construct() {}

    /**
     * Authenticate the user's access to the channel.
     */
    public function join(Operator $user): array|bool {}
}
