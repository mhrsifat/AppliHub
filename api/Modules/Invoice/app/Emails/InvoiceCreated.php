<?php

namespace Modules\Invoice\Emails;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Modules\Invoice\Models\Invoice;

class InvoiceCreated extends Mailable
{
    use Queueable, SerializesModels;

    public Invoice $invoice;

    /**
     * Create a new message instance.
     *
     * @param Invoice $invoice
     */
    public function __construct(Invoice $invoice)
    {
        $this->invoice = $invoice;
    }

    public function build()
    {
        // Use a simple view 'emails.invoice' or customize as needed.
        return $this->subject("Invoice #{$this->invoice->invoice_number}")
                    ->view('invoice::emails.invoice_created')
                    ->with(['invoice' => $this->invoice]);
    }
}
