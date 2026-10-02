<?php

namespace App\Http\Requests\Inventory;

use App\Enums\InventoryStatus;
use App\Models\InventoryItem;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateInventoryItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $storeId = $this->user()?->store_id;
        /** @var InventoryItem $item */
        $item = $this->route('inventoryItem');

        return [
            'product_id' => [
                'required',
                'integer',
                Rule::exists('products', 'id')->where(fn ($q) => $q->where('store_id', $storeId)),
            ],
            'imei' => [
                'required',
                'string',
                'max:32',
                Rule::unique('inventory_items', 'imei')
                    ->where(fn ($q) => $q->where('store_id', $storeId))
                    ->ignore($item?->id),
            ],
            'serial' => ['nullable', 'string', 'max:64'],
            'condition_grade' => ['nullable', 'string', 'max:50'],
            'battery_health' => ['nullable', 'integer', 'min:1', 'max:100'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'min_sale_price' => ['nullable', 'numeric', 'min:0'],
            'regular_sale_price' => ['nullable', 'numeric', 'min:0'],
            'purchased_at' => ['required', 'date'],
            'warranty_months' => ['nullable', 'integer', 'min:0', 'max:120'],
            'warranty_expires_at' => ['nullable', 'date'],
            'status' => ['required', Rule::enum(InventoryStatus::class)],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->hasAny(['min_sale_price', 'regular_sale_price'])) {
                return;
            }

            $min = $this->input('min_sale_price');
            $regular = $this->input('regular_sale_price');

            if ($min === null || $min === '' || $regular === null || $regular === '') {
                return;
            }

            if ((float) $regular < (float) $min) {
                $validator->errors()->add(
                    'regular_sale_price',
                    'El precio regular no puede ser menor que el precio mínimo.',
                );
            }
        });
    }
}
