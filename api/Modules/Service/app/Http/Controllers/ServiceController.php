<?php

namespace Modules\Service\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Service\Models\Service;
use Modules\Service\Models\ServicePriceHistory;
use Modules\Service\Http\Requests\StoreServiceRequest;
use Modules\Service\Http\Requests\UpdateServiceRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $query = Service::query()->with(['category','addons']);

        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function($q2) use ($q) {
                $q2->where('title','like', "%{$q}%")
                   ->orWhere('sku','like', "%{$q}%")
                   ->orWhere('slug','like', "%{$q}%");
            });
        }

        if ($request->filled('category_id')) $query->where('service_category_id', $request->category_id);
        if ($request->filled('is_active')) $query->where('is_active', (bool)$request->is_active);

        $services = $query->orderBy('title')->paginate($request->get('per_page', 15));
        return response()->json($services);
    }

    public function store(StoreServiceRequest $request)
    {
        $data = $request->validated();
        if (empty($data['slug'])) $data['slug'] = Str::slug($data['title']);
        $service = Service::create($data);

        ServicePriceHistory::create([
            'service_id' => $service->id,
            'old_price' => 0,
            'new_price' => $service->price,
            'note' => 'Initial price set'
        ]);

        return response()->json($service, Response::HTTP_CREATED);
    }

    public function show(Service $service)
    {
        $service->load(['category','addons','priceHistories']);
        return response()->json($service);
    }

    public function update(UpdateServiceRequest $request, Service $service)
    {
        $data = $request->validated();

        if (array_key_exists('price', $data) && $data['price'] != $service->price) {
            ServicePriceHistory::create([
                'service_id' => $service->id,
                'old_price' => $service->price,
                'new_price' => $data['price'],
                'changed_by_type' => $request->user() ? get_class($request->user()) : null,
                'changed_by_id' => $request->user()->id ?? null,
                'note' => $request->get('price_note')
            ]);
        }

        if (empty($data['slug']) && isset($data['title'])) {
            $data['slug'] = Str::slug($data['title']);
        }

        $service->update($data);
        return response()->json($service);
    }

    public function destroy(Service $service)
    {
        $service->delete();
        return response()->json(['message' => 'Service deleted']);
    }

    public function restore($id)
    {
        $service = Service::withTrashed()->findOrFail($id);
        $service->restore();
        return response()->json($service);
    }

    public function priceHistory(Service $service)
    {
        return response()->json($service->priceHistories()->orderByDesc('created_at')->get());
    }

    public function import(Request $request)
    {
        $file = $request->file('file');
        if (!$file) return response()->json(['message'=>'No file'], 422);

        $rows = array_map('str_getcsv', file($file->getRealPath()));
        $header = array_map('strtolower', array_shift($rows));
        $created = 0;
        foreach ($rows as $row) {
            $row = array_combine($header, $row);
            $service = Service::firstOrCreate(
                ['slug' => Str::slug($row['title'] ?? 'untitled'), 'sku' => $row['sku'] ?? null],
                [
                    'title' => $row['title'] ?? 'Untitled',
                    'price' => $row['price'] ?? 0,
                    'vat_percent' => $row['vat_percent'] ?? 0,
                    'vat_applicable' => isset($row['vat_percent']) && $row['vat_percent'] > 0
                ]
            );
            $created++;
        }
        return response()->json(['imported' => $created]);
    }

    public function export(Request $request)
    {
        $services = Service::with(['category'])->get();
        $csv = "id,title,sku,slug,price,vat_percent,category\n";
        foreach ($services as $s) {
            $csv .= implode(',', [
                $s->id,
                '"'.str_replace('"','""',$s->title).'"',
                $s->sku,
                $s->slug,
                $s->price,
                $s->vat_percent,
                $s->category->slug ?? ''
            ]) . "\n";
        }
        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename=services.csv'
        ]);
    }
}
