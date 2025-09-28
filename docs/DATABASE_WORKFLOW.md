# Database Migration Workflow

This document outlines the proper workflow for database changes to avoid migration conflicts.

## 🚨 IMPORTANT: Migration files are now tracked in Git!

## For Schema Changes:

### 1. Making Changes
```bash
# 1. Pull latest changes first
git pull origin main

# 2. Make your schema changes in prisma/schema.prisma
# Edit schema.prisma file

# 3. Create and apply migration
npm run db:migrate
# This will prompt you for a descriptive migration name

# 4. Commit both schema AND migration files
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add user profile fields"

# 5. Push changes
git push origin your-branch
```

### 2. Receiving Changes
```bash
# 1. Pull latest changes
git pull origin main

# 2. Apply new migrations
npm run db:migrate:deploy

# 3. Regenerate Prisma client
npm run db:generate
```

### 3. In Case of Conflicts
```bash
# If you have local changes that conflict:
# 1. Stash your changes
git stash

# 2. Pull latest
git pull origin main

# 3. Apply migrations
npm run db:migrate:deploy

# 4. Apply your stashed changes
git stash pop

# 5. Create your migration
npm run db:migrate
```

## Database Commands Reference:

- `npm run db:migrate` - Create and apply new migration (development)
- `npm run db:migrate:deploy` - Apply existing migrations (production/CI)
- `npm run db:migrate:reset` - Reset database and apply all migrations
- `npm run db:generate` - Regenerate Prisma client
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with test data
- `npm run db:push` - Push schema without creating migration (prototyping only)

## Migration Best Practices:

1. **Always pull before making schema changes**
2. **Use descriptive migration names** (e.g., "add_user_preferences", "fix_appointment_constraints")
3. **Test migrations locally before pushing**
4. **Never edit migration files manually**
5. **Commit schema.prisma AND migration files together**
6. **Use `db:push` only for prototyping, never in production**

## Troubleshooting:

### Migration conflicts:
```bash
# If you get "migration conflicts" error:
npm run db:migrate:reset  # ⚠️ This will delete all data!
npm run db:seed          # Restore test data
```

### Schema drift detected:
```bash
# Usually means manual database changes were made
npm run db:migrate:reset  # Reset to clean state
npm run db:seed          # Restore test data
```

### Database connection issues:
```bash
# Check your .env file DATABASE_URL
# Ensure PostgreSQL is running
# Verify database exists
```