<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Invoice */
class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $canViewCosts = $request->user()?->canViewCosts() ?? false;

        $data = [
            'id' => $this->id,
            'store_id' => $this->store_id,
            'number' => $this->number,
            'customer_name' => $this->customer_name,
            'customer_phone' => $this->customer_phone,
            'subtotal' => $this->subtotal,
            'trade_in_credit' => $this->trade_in_credit,
            'amount_due' => $this->amount_due,
            'payment_method' => $this->payment_method?->value ?? $this->payment_method,
            'amount_paid' => $this->amount_paid,
            'status' => $this->status?->value ?? $this->status,
            'ecf_status' => $this->ecf_status?->value ?? $this->ecf_status,
            'pdf_path' => $this->pdf_path,
            'pdf_status' => $this->pdf_status ?? null,
            'voided_at' => $this->voided_at,
            'void_reason' => $this->void_reason,
            'items' => $this->whenLoaded('items', function () use ($canViewCosts) {
                return $this->items->map(fn ($item) => [
                    'id' => $item->id,
                    'inventory_item_id' => $item->inventory_item_id,
                    'product_name' => $item->product_name,
                    'imei' => $item->imei,
                    'sale_price' => $item->sale_price,
                    'cost_snapshot' => $canViewCosts ? $item->cost_snapshot : null,
                    'margin' => $canViewCosts ? $item->margin() : null,
                ]);
            }),
            'trade_ins' => $this->whenLoaded('tradeIns'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];

        if ($canViewCosts && $this->relationLoaded('items')) {
            $data['gross_margin'] = $this->grossMargin();
        }

        return $data;
    }
}
