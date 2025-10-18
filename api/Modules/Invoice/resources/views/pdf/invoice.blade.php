<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice #{{ $invoice->invoice_number }} | AppliHub</title>
  <style>
    @page { margin: 35px; }
    body {
      font-family: "DejaVu Sans", sans-serif;
      color: #111827;
      font-size: 12px;
      background-color: #ffffff;
    }

    .invoice-container { width: 100%; }

    /* ===== HEADER ===== */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 10px;
      margin-bottom: 25px;
    }

    .company-info h1 {
      font-size: 20px;
      color: #1e3a8a;
      margin: 0 0 4px 0;
    }

    .company-info p {
      margin: 2px 0;
      color: #374151;
      font-size: 11px;
    }

    .invoice-meta {
      text-align: right;
      color: #374151;
      font-size: 12px;
    }

    .invoice-meta h2 {
      margin: 0;
      color: #111827;
    }

    /* ===== TABLE ===== */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    th {
      background: #f3f4f6;
      text-align: left;
      padding: 8px;
      border: 1px solid #e5e7eb;
      font-weight: 600;
      color: #374151;
    }

    td {
      border: 1px solid #e5e7eb;
      padding: 8px;
      vertical-align: top;
      color: #111827;
    }

    /* ===== SUMMARY ===== */
    .summary {
      margin-top: 20px;
      text-align: right;
    }

    .summary p {
      margin: 3px 0;
      font-size: 12px;
    }

    .summary .label {
      font-weight: 600;
      color: #111827;
    }

    /* ===== FOOTER ===== */
    .footer {
      border-top: 1px solid #e5e7eb;
      margin-top: 40px;
      padding-top: 10px;
      text-align: center;
      font-size: 11px;
      color: #6b7280;
    }

    .footer strong {
      color: #111827;
    }
  </style>
</head>

<body>
  <div class="invoice-container">
    <!-- HEADER -->
    <div class="header">
      <div class="company-info">
        <h1>AppliHub</h1>
        <p>Smart Business Management Platform</p>
        <p>Website: www.applihub.com</p>
        <p>Email: support@applihub.com</p>
        <p>Phone: +880 1700-000000</p>
      </div>

      <div class="invoice-meta">
        <h2>Invoice #{{ $invoice->invoice_number }}</h2>
        <p>Date: {{ $invoice->created_at->format('d M Y') }}</p>
        <p>Customer: {{ $invoice->customer_name }}</p>
        <p>Email: {{ $invoice->customer_email }}</p>
      </div>
    </div>

    <!-- TABLE -->
    <table>
      <thead>
        <tr>
          <th>Service</th>
          <th>Quantity</th>
          <th>Unit Price (BDT)</th>
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

    <!-- SUMMARY -->
    <div class="summary">
      <p><span class="label">Subtotal:</span> {{ number_format($invoice->sub_total, 2) }} BDT</p>
      @if($invoice->vat_percent)
        <p><span class="label">VAT ({{ $invoice->vat_percent }}%):</span> {{ number_format($invoice->vat_amount, 2) }} BDT</p>
      @endif
      @if($invoice->coupon_discount)
        <p><span class="label">Discount:</span> -{{ number_format($invoice->coupon_discount, 2) }} BDT</p>
      @endif
      <p><span class="label">Grand Total:</span> {{ number_format($invoice->grand_total, 2) }} BDT</p>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <p>Thank you for your business with <strong>AppliHub</strong>.</p>
      <p>This is a computer-generated invoice — no signature required.</p>
    </div>
  </div>
</body>
</html>