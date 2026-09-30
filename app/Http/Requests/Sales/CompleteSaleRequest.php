<?php

namespace App\Http\Requests\Sales;

use App\Enums\PaymentMethod;
use App\Enums\SellerIdType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CompleteSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $storeId = $this->user()?->store_id;

        return [
            'customer_name' => ['nullable', 'string', 'max:150'],
            'customer_phone' => ['nullable', 'string', 'max:30'],
            'payment_method' => ['required', Rule::enum(PaymentMethod::class)],
            'amount_paid' => ['nullable', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.inventory_item_id' => [
                'required',
                'integer',
                Rule::exists('inventory_items', 'id')->where(fn ($q) => $q->where('store_id', $storeId)),
            ],
            'items.*.sale_price' => ['required', 'numeric', 'min:0'],
            'trade_ins' => ['nullable', 'array'],
            'trade_ins.*.product_id' => [
                'required_with:trade_ins',
                'integer',
                Rule::exists('products', 'id')->where(fn ($q) => $q->where('store_id', $storeId)),
            ],
            'trade_ins.*.imei' => [
                'required_with:trade_ins',
                'string',
                'max:32',
                Rule::unique('inventory_items', 'imei')->where(fn ($q) => $q->where('store_id', $storeId)),
            ],
            'trade_ins.*.serial' => ['nullable', 'string', 'max:64'],
            'trade_ins.*.condition_grade' => ['nullable', 'string', 'max:20'],
            'trade_ins.*.battery_health' => ['nullable', 'integer', 'min:0', 'max:100'],
            'trade_ins.*.credited_value' => ['required_with:trade_ins', 'numeric', 'min:0'],
            'trade_ins.*.seller_name' => ['required_with:trade_ins', 'string', 'max:150'],
            'trade_ins.*.seller_id_type' => ['required_with:trade_ins', Rule::enum(SellerIdType::class)],
            'trade_ins.*.seller_id_number' => ['required_with:trade_ins', 'string', 'max:50'],
            'trade_ins.*.seller_phone' => ['required_with:trade_ins', 'string', 'max:30'],
            'trade_ins.*.min_sale_price' => ['nullable', 'numeric', 'min:0'],
            'trade_ins.*.notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
