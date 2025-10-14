<?php

namespace Modules\Invoice\Policies;

use App\Models\User;
use Modules\Invoice\Models\Invoice;

class InvoicePolicy
{
    public function viewAny(User $user)
    {
        // Everyone logged in can view invoices
        return true;
    }

    public function view(User $user, Invoice $invoice)
    {
        // Everyone can view any invoice
        return true;
    }

    public function create(User $user)
    {
        // Only admin or employee can create
        return $user->hasRole('admin') || $user->hasRole('employee');
    }

    public function update(User $user, Invoice $invoice)
    {
        // Admin or the employee assigned to the order can update
        if ($user->hasRole('admin')) return true;

        return $user->hasRole('employee')
            && optional($invoice->order)->assigned_to === $user->id
            && optional($invoice->order)->assigned_type === 'employee';
    }

    public function delete(User $user, Invoice $invoice)
    {
        // Same logic as update
        return $this->update($user, $invoice);
    }
}