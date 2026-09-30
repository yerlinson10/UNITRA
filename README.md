# UNITRA

POS e inventario por IMEI con Trade-In. Stack: Laravel 13 + Inertia + React + Tailwind + PostgreSQL + Redis + Gotenberg.

## Arranque con Docker

```bash
cp .env.example .env
# Genera APP_KEY si hace falta:
docker compose run --rm app php artisan key:generate

docker compose up -d --build
docker compose exec app php artisan migrate --seed
```

App: http://localhost:8080

### Usuarios seed

| Email | Password | Rol |
|-------|----------|-----|
| admin@unitra.local | password | admin |
| cashier@unitra.local | password | cashier |

## Desarrollo local (sin Docker app)

Requiere PHP 8.4+, Composer, Node 24+, Postgres/Redis opcionales (sqlite para tests).

```bash
composer install
cp .env.example .env && php artisan key:generate
# Ajusta DB_* en .env
php artisan migrate --seed
npm install --legacy-peer-deps
npm run dev
php artisan serve
```

## Módulos

- Catálogo / Inventario IMEI
- Compras a particulares
- POS + Trade-In
- Facturas (comprobantes internos) + stubs e-CF
- PDFs vía Gotenberg (cola Redis)
- Caja y reportes de margen (admin)

## Tests

```bash
php artisan test --filter='PurchaseCreatesInventoryTest|CompleteSaleWithTradeInTest|CashierCannotSeeCostTest'
```
