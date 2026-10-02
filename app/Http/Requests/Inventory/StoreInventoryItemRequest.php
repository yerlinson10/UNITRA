<?php

namespace App\Http\Requests\Inventory;

use App\Enums\InventoryOrigin;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreInventoryItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $storeId = $this->user()?->store_id;

        return [
            'product_id' => [
                'nullable',
                'integer',
                Rule::exists('products', 'id')->where(fn ($q) => $q->where('store_id', $storeId)),
            ],
            'brand' => ['nullable', 'required_without:product_id', 'string', 'max:100'],
            'model' => ['nullable', 'required_without:product_id', 'string', 'max:100'],
            'storage' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:50'],
            'imei' => [
                'required',
                'string',
                'max:32',
                Rule::unique('inventory_items', 'imei')->where(fn ($q) => $q->where('store_id', $storeId)),
            ],
            'serial' => ['nullable', 'string', 'max:64'],
            'condition_grade' => ['nullable', 'string', 'max:50'],
            'battery_health' => ['nullable', 'integer', 'min:1', 'max:100'],
            'cost' => ['required', 'numeric', 'min:0'],
            'min_sale_price' => ['nullable', 'numeric', 'min:0'],
            'regular_sale_price' => ['nullable', 'numeric', 'min:0'],
            'purchased_at' => ['required', 'date'],
            'warranty_months' => ['nullable', 'integer', 'min:0', 'max:120'],
            'warranty_expires_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'origin' => ['nullable', Rule::enum(InventoryOrigin::class)],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $this->validateRegularAgainstMin($validator, 'min_sale_price', 'regular_sale_price');
        });
    }

    private function validateRegularAgainstMin(
        Validator $validator,
        string $minKey,
        string $regularKey,
    ): void {
        if ($validator->errors()->hasAny([$minKey, $regularKey])) {
            return;
        }

        $min = $this->input($minKey);
        $regular = $this->input($regularKey);

        if ($min === null || $min === '' || $regular === null || $regular === '') {
            return;
        }

        if ((float) $regular < (float) $min) {
            $validator->errors()->add(
                $regularKey,
                'El precio regular no puede ser menor que el precio mínimo.',
            );
        }
    }
}
