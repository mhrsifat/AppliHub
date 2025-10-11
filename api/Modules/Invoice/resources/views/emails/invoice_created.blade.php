<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice #{{ $invoice->invoice_number }}</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; background-color: #f9fafb; color: #111827; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .header { border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px; }
        .invoice-number { font-size: 24px; font-weight: bold; color: #111827; }
        .details, .items { width: 100%; margin-bottom: 20px; }
        .items th, .items td { padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .total { text-align: right; font-weight: bold; font-size: 18px; }
        .footer { font-size: 12px; color: #6b7280; text-align: center; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="invoice-number">Invoice #{{ $invoice->invoice_number }}</div>
            <div>Date: {{ $invoice->created_at->format('d M Y') }}</div>
        </div>

        <div class="details">
            <p><strong>Customer:</strong> {{ $invoice->customer_name }}</p>
            <p><strong>Email:</strong> {{ $invoice->customer_email }}</p>
        </div>

        <table class="items">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($invoice->items as $item)
                <tr>
                    <td>{{ $item->name }}</td>
                    <td>{{ $item->quantity }}</td>
                    <td>{{ number_format($item->price, 2) }}</td>
                    <td>{{ number_format($item->quantity * $item->price, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <div class="total">
            Total: ${{ number_format($invoice->total_amount, 2) }}
        </div>

        <div class="footer">
            Thank you for your business!<br>
            This is an automated email from our system.
        </div>
    </div>
</body>
</html>