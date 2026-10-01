<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\InventoryItem */
class InventoryItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $canViewCosts = $request->user()?->canViewCosts() ?? false;

        $data = [
            'id' => $this->id,
            'store_id' => $this->store_id,
            'product_id' => $this->product_id,
            'product' => $this->whenLoaded('product', fn () => [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'brand' => $this->product->brand,
                'model' => $this->product->model,
                'storage' => $this->product->storage,
                'color' => $this->product->color,
            ]),
            'imei' => $this->imei,
            'serial' => $this->serial,
            'condition_grade' => $this->condition_grade,
            'condition' => $this->condition_grade,
            'battery_health' => $this->battery_health,
            'min_sale_price' => $this->min_sale_price,
            'min_price' => $this->min_sale_price,
            'purchased_at' => $this->purchased_at?->toDateString(),
            'warranty_months' => $this->warranty_months,
            'sold_at' => $this->sold_at?->toIso8601String(),
            'warranty_expires_at' => $this->warranty_expires_at?->toDateString(),
            'status' => $this->status?->value ?? $this->status,
            'origin' => $this->origin?->value ?? $this->origin,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];

        if ($canViewCosts) {
            $data['cost'] = $this->cost;
        }

        return $data;
    }
}
