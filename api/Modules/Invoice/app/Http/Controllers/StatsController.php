<?php

namespace Modules\Invoice\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Invoice\Models\Invoice;
use Modules\Invoice\Models\InvoiceItem;
use Modules\Invoice\Models\InvoicePayment;
use Modules\Invoice\Models\Refund;
use Modules\Order\Models\Order;

class StatsController extends Controller
{
    /**
     * Get aggregated stats for a single order.
     *
     * Response includes:
     *  - order summary
     *  - invoices list (basic)
     *  - totals: total_invoice_amount, total_paid, total_due
     */
    public function orderStats(int $orderId)
    {
        $order = Order::with(['items'])->findOrFail($orderId);

        // invoices belonging to this order (basic columns)
        $invoices = Invoice::where('order_id', $orderId)
            ->select('id', 'invoice_number', 'status', 'subtotal', 'vat_amount', 'coupon_discount', 'grand_total', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();

        // total invoices amount (sum of grand_total)
        $totalInvoiceAmount = Invoice::where('order_id', $orderId)->sum('grand_total');

        // total paid against those invoices (only completed payments)
        $totalPaid = InvoicePayment::whereHas('invoice', function ($q) use ($orderId) {
                $q->where('order_id', $orderId);
            })
            ->where('status', 'completed')
            ->sum('amount');

        $totalRefunds = Refund::whereHas('invoice', function ($q) use ($orderId) {
                $q->where('order_id', $orderId);
            })->sum('amount');

        $totalDue = max(0, $totalInvoiceAmount - $totalPaid + $totalRefunds);

        return response()->json([
            'order' => $order,
            'invoices' => $invoices,
            'totals' => [
                'total_invoice_amount' => (float) $totalInvoiceAmount,
                'total_paid' => (float) $totalPaid,
                'total_refunds' => (float) $totalRefunds,
                'total_due' => (float) $totalDue,
                'invoices_count' => $invoices->count(),
            ],
        ]);
    }

    /**
     * Get all info against one invoice (invoice = ইনভয়েস).
     *
     * includes: invoice, order, items, payments, refunds, paid_amount, due_amount
     */
    public function invoiceDetails(int $invoiceId)
    {
        $invoice = Invoice::with([
            'items',
            'payments' => function ($q) {
                $q->orderBy('created_at', 'desc');
            },
            'refunds' => function ($q) {
                $q->orderBy('created_at', 'desc');
            },
            'order'
        ])->findOrFail($invoiceId);

        // paid amount (only completed)
        $paidAmount = $invoice->payments()->where('status', 'completed')->sum('amount');

        // refunds total (all statuses) - you may filter by completed if desired
        $refundTotal = $invoice->refunds()->sum('amount');

        // due calculation
        $dueAmount = max(0, (float)$invoice->grand_total - (float)$paidAmount + (float)$refundTotal);

        return response()->json([
            'invoice' => $invoice,
            'paid_amount' => (float)$paidAmount,
            'refund_total' => (float)$refundTotal,
            'due_amount' => (float)$dueAmount,
        ]);
    }

    /**
     * Dashboard stats (high level) for admin dashboard (dashboard = ড্যাশবোর্ড)
     *
     * Returns:
     *  - total_revenue (sum of completed payments)
     *  - total_refunds
     *  - total_invoices, paid_invoices_count, unpaid_invoices_count
     *  - total_due (sum of due across invoices)
     *  - monthly_revenue (last 12 months)
     *  - recent_invoices (last 10)
     */
    public function dashboardStats()
    {
        // total revenue from completed payments
        $totalRevenue = InvoicePayment::where('status', 'completed')->sum('amount');

        // total refunds
        $totalRefunds = Refund::sum('amount');

        // total invoices count
        $totalInvoices = Invoice::count();

        // invoices that have any completed payment
        $invoicesWithPayments = Invoice::whereHas('payments', function ($q) {
            $q->where('status', 'completed');
        });

        // paid invoices: invoice where sum(completed payments) >= grand_total
        // Use subquery to calculate paid_count in DB
        $paidInvoicesCount = DB::table('invoices')
            ->selectRaw('count(*) as cnt')
            ->whereExists(function ($q) {
                $q->select(DB::raw(1))
                    ->from('invoice_payments')
                    ->whereColumn('invoice_payments.invoice_id', 'invoices.id')
                    ->where('invoice_payments.status', 'completed')
                    ->groupBy('invoice_payments.invoice_id')
                    ->havingRaw('SUM(invoice_payments.amount) >= invoices.grand_total');
            })->value('cnt') ?? 0;

        // unpaid invoices (simple heuristic: no completed payments OR paid < grand_total)
        $unpaidInvoicesCount = $totalInvoices - (int)$paidInvoicesCount;

        // total due: sum of (grand_total - completed payments) for invoices where difference > 0
        // We'll compute using a left join and aggregation:
        $totalDue = DB::table('invoices')
            ->leftJoin('invoice_payments as ip', function ($join) {
                $join->on('ip.invoice_id', '=', 'invoices.id')
                     ->where('ip.status', '=', 'completed');
            })
            ->selectRaw('invoices.id, invoices.grand_total, COALESCE(SUM(ip.amount),0) as paid_sum')
            ->groupBy('invoices.id', 'invoices.grand_total')
            ->get()
            ->reduce(function ($carry, $row) {
                $due = max(0, (float)$row->grand_total - (float)$row->paid_sum);
                return $carry + $due;
            }, 0.0);

        // monthly revenue (last 12 months) from completed payments
        $monthlyRevenue = DB::table('invoice_payments')
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, SUM(amount) as total")
            ->where('status', 'completed')
            ->groupBy('month')
            ->orderBy('month', 'desc')
            ->limit(12)
            ->get();

        // recent invoices
        $recentInvoices = Invoice::with('order')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get(['id','invoice_number','grand_total','status','created_at','order_id']);

        return response()->json([
            'total_revenue' => (float)$totalRevenue,
            'total_refunds' => (float)$totalRefunds,
            'total_invoices' => (int)$totalInvoices,
            'paid_invoices_count' => (int)$paidInvoicesCount,
            'unpaid_invoices_count' => (int)$unpaidInvoicesCount,
            'total_due' => (float)$totalDue,
            'monthly_revenue' => $monthlyRevenue,
            'recent_invoices' => $recentInvoices,
        ]);
    }

    /**
     * Generic invoices report endpoint.
     *
     * Accepts optional filters:
     *  - date_from (YYYY-MM-DD)
     *  - date_to   (YYYY-MM-DD)
     *  - status    (issued, paid, cancelled, etc.)
     *
     * Returns aggregated sums and paginated invoice list.
     */
    public function reportInvoices(Request $request)
    {
        $q = Invoice::query();

        if ($request->filled('date_from')) {
            $q->whereDate('created_at', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $q->whereDate('created_at', '<=', $request->input('date_to'));
        }
        if ($request->filled('status')) {
            $q->where('status', $request->input('status'));
        }

        // aggregates
        $aggregates = (clone $q)->selectRaw('COUNT(*) as count, COALESCE(SUM(grand_total),0) as total_grand')
            ->first();

        // paginated list
        $invoices = $q->with(['order'])->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'aggregates' => [
                'count' => (int)$aggregates->count,
                'total_grand' => (float)$aggregates->total_grand,
            ],
            'invoices' => $invoices,
        ]);
    }
}