<?php

namespace App\Http\Requests\Sales;

use App\Enums\PaymentMethod;
use App\Enums\SellerIdType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
                'distinct',
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
            'trade_ins.*.regular_sale_price' => ['nullable', 'numeric', 'min:0'],
            'trade_ins.*.notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            foreach ($this->input('trade_ins', []) as $index => $tradeIn) {
                if (! is_array($tradeIn)) {
                    continue;
                }

                $minKey = "trade_ins.{$index}.min_sale_price";
                $regularKey = "trade_ins.{$index}.regular_sale_price";

                if ($validator->errors()->hasAny([$minKey, $regularKey])) {
                    continue;
                }

                $min = $tradeIn['min_sale_price'] ?? null;
                $regular = $tradeIn['regular_sale_price'] ?? null;

                if ($min === null || $min === '' || $regular === null || $regular === '') {
                    continue;
                }

                if ((float) $regular < (float) $min) {
                    $validator->errors()->add(
                        $regularKey,
                        'El precio regular no puede ser menor que el precio mínimo.',
                    );
                }
            }

            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            if (! $this->filled('amount_paid')) {
                return;
            }

            $subtotal = collect($this->input('items', []))
                ->sum(fn (array $item): float => (float) ($item['sale_price'] ?? 0));

            $tradeInCredit = collect($this->input('trade_ins', []))
                ->sum(fn (array $tradeIn): float => (float) ($tradeIn['credited_value'] ?? 0));

            $amountDue = max(0, $subtotal - $tradeInCredit);

            if ((float) $this->input('amount_paid') < $amountDue) {
                $validator->errors()->add(
                    'amount_paid',
                    'El monto pagado no puede ser menor al monto a pagar.',
                );
            }
        });
    }
}
