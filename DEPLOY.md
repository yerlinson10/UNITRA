# Production deploy notes

## Required after migrate

Spatie roles/permissions are seeded, not migrated as data. After deploying schema migrations, run:

```bash
php artisan db:seed --class=RolesAndPermissionsSeeder --force
```

Without this, authorization based on Spatie permissions will be empty in new environments. The seeder is idempotent.

Also ensure the public storage link exists:

```bash
php artisan storage:link
```

(needed for store logos)
