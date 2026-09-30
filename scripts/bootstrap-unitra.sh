#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -d .git ]; then
  git init
  echo "Initialized git repository in POSMobile"
fi

export NVM_DIR="${HOME}/.nvm"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 24 >/dev/null 2>&1 || true

php artisan migrate --force
php artisan db:seed --force
php artisan test --filter='PurchaseCreatesInventoryTest|CompleteSaleWithTradeInTest|CashierCannotSeeCostTest'
