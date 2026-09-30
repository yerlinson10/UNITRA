<?php

namespace App\Http\Requests\Purchases;

use App\Enums\SellerIdType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePurchaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $storeId = $this->user()?->store_id;

        return [
            'seller_name' => ['required', 'string', 'max:150'],
            'seller_id_type' => ['required', Rule::enum(SellerIdType::class)],
            'seller_id_number' => ['required', 'string', 'max:50'],
            'seller_phone' => ['required', 'string', 'max:30'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => [
                'required',
                'integer',
                Rule::exists('products', 'id')->where(fn ($q) => $q->where('store_id', $storeId)),
            ],
            'items.*.imei' => [
                'required',
                'string',
                'max:32',
                Rule::unique('inventory_items', 'imei')->where(fn ($q) => $q->where('store_id', $storeId)),
            ],
            'items.*.serial' => ['nullable', 'string', 'max:64'],
            'items.*.condition_grade' => ['nullable', 'string', 'max:50'],
            'items.*.battery_health' => ['nullable', 'integer', 'min:0', 'max:100'],
            'items.*.cost' => ['required', 'numeric', 'min:0'],
            'items.*.min_sale_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
