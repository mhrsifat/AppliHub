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

    public function __construct(Invoice $invoice)
    {
        $this->invoice = $invoice;
    }

    public function build()
    {
        $frontend = config('app.frontend_url');

        $payUrl = "{$frontend}/invoices/{$this->invoice->id}/pay";
        $pdfUrl = url("/api/invoices/{$this->invoice->id}/pdf");

        return $this->subject("Invoice #{$this->invoice->invoice_number}")
            ->view('invoice::emails.invoice_created')
            ->with([
                'invoice' => $this->invoice,
                'payUrl' => $payUrl,
                'pdfUrl' => $pdfUrl,
            ]);
    }
}