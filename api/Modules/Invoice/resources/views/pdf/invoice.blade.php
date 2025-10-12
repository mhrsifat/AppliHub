<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice #{{ $invoice->invoice_number }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #111827; font-size: 12px; }
        .container { width: 100%; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; }
        th { background: #f3f4f6; }
        .total { text-align: right; font-weight: bold; }
        .header { margin-bottom: 20px; }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h2>Invoice #{{ $invoice->invoice_number }}</h2>
        <p>Date: {{ $invoice->created_at->format('d M Y') }}</p>
        <p>Customer: {{ $invoice->customer_name }}</p>
        <p>Email: {{ $invoice->customer_email }}</p>
    </div>

    <table>
        <thead>
        <tr>
            <th>Service</th>
            <th>Qty</th>
            <th>Price (BDT)</th>
            <th>Total</th>
        </tr>
        </thead>
        <tbody>
        @foreach($invoice->items as $item)
        <tr>
            <td>{{ $item->service_name }}</td>
            <td>{{ $item->quantity }}</td>
            <td>{{ number_format($item->unit_price, 2) }}</td>
            <td>{{ number_format($item->line_total, 2) }}</td>
        </tr>
        @endforeach
        </tbody>
    </table>

    <p class="total">Grand Total: {{ number_format($invoice->grand_total, 2) }} BDT</p>
</div>
</body>
</html>