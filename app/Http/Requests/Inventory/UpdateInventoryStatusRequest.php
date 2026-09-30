<?php

namespace App\Http\Requests\Inventory;

use App\Enums\InventoryStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInventoryStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(InventoryStatus::class)],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
