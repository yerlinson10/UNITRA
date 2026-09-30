#!/usr/bin/env bash
set -euo pipefail
cd /home/monkey/POSMobile

mkdir -p app/Enums app/Services/Sales app/Services/Purchases app/Services/Documents app/Services/Cash \
  app/Http/Controllers app/Http/Requests app/Http/Middleware app/Policies app/Support \
  resources/views/pdf database/migrations tests/Feature

# Enums
cat > app/Enums/UserRole.php <<'PHP'
<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Cashier = 'cashier';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Administrador',
            self::Cashier => 'Cajero',
        };
    }
}
PHP

cat > app/Enums/InventoryStatus.php <<'PHP'
<?php

namespace App\Enums;

enum InventoryStatus: string
{
    case Available = 'available';
    case Sold = 'sold';
    case InRepair = 'in_repair';
    case Returned = 'returned';

    public function label(): string
    {
        return match ($this) {
            self::Available => 'Disponible',
            self::Sold => 'Vendido',
            self::InRepair => 'En reparación',
            self::Returned => 'Devuelto',
        };
    }
}
PHP

cat > app/Enums/InventoryOrigin.php <<'PHP'
<?php

namespace App\Enums;

enum InventoryOrigin: string
{
    case Purchase = 'purchase';
    case TradeIn = 'trade_in';
    case Other = 'other';
}
PHP

cat > app/Enums/PaymentMethod.php <<'PHP'
<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Cash = 'cash';
    case Card = 'card';
    case Transfer = 'transfer';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Efectivo',
            self::Card => 'Tarjeta',
            self::Transfer => 'Transferencia',
        };
    }
}
PHP

cat > app/Enums/InvoiceStatus.php <<'PHP'
<?php

namespace App\Enums;

enum InvoiceStatus: string
{
    case Completed = 'completed';
    case Void = 'void';
}
PHP

cat > app/Enums/EcfStatus.php <<'PHP'
<?php

namespace App\Enums;

enum EcfStatus: string
{
    case NotApplicable = 'not_applicable';
    case Pending = 'pending';
    case Ready = 'ready';
    case Sent = 'sent';
    case Accepted = 'accepted';
    case Rejected = 'rejected';
}
PHP

cat > app/Enums/SellerIdType.php <<'PHP'
<?php

namespace App\Enums;

enum SellerIdType: string
{
    case Cedula = 'cedula';
    case Pasaporte = 'pasaporte';
}
PHP

cat > app/Enums/CashSessionStatus.php <<'PHP'
<?php

namespace App\Enums;

enum CashSessionStatus: string
{
    case Open = 'open';
    case Closed = 'closed';
}
PHP

cat > app/Enums/CashMovementType.php <<'PHP'
<?php

namespace App\Enums;

enum CashMovementType: string
{
    case SaleIn = 'sale_in';
    case PurchaseOut = 'purchase_out';
    case AdjustmentIn = 'adjustment_in';
    case AdjustmentOut = 'adjustment_out';
}
PHP

echo "Enums OK"
PHP
