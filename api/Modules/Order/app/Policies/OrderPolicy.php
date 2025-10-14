<?php

namespace Modules\Order\Policies;

use App\Models\User;
use Modules\Order\Models\Order;
use Illuminate\Auth\Access\HandlesAuthorization;

class OrderPolicy
{
    public function view(User $user, Order $order)
    {
        // admin/managers can view all (assume 'is_admin' flag or role check)
        if ($user->hasRole('admin') || $user->hasRole('manager')) {
            return true;
        }

        // assigned employee can view
        if ($order->assigned_to && $order->assigned_to === $user->id) {
            return true;
        }

        // creator can view
        if ($order->created_by === $user->id) {
            return true;
        }

        return false;
    }

   public function assign(User $user, Order $order)
{
    // Only admin can assign/unassign
    return $user->hasRole('admin');
}

    // other abilities...
}