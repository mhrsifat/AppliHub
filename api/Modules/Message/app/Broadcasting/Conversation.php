<?php

namespace Modules\Message\Broadcasting;

class conversation
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
