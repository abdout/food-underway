# School to Merchant Refactor Status

## Overview
Refactoring multi-tenant schools platform to multi-tenant merchant/restaurant platform.

## Onboarding Steps Simplified
**Old Steps (Commented Out):**
- description, location, capacity, branding, import, join, visibility, price, discount, legal, information, stand-out

**New Active Steps (3 steps - one per stage):**
1. **title** - Merchant name (Stage 1: Basic)
2. **subdomain** - Merchant domain (Stage 2: Setup)
3. **finish-setup** - Complete setup (Stage 3: Business)

## Files Requiring Updates

### Critical (Blocking Build)
- [ ] `src/components/onboarding/card.tsx` - Remove old step references
- [ ] `src/components/onboarding/form.tsx` - Remove old step references
- [ ] `src/components/onboarding/util.ts` - Remove old step references
- [ ] `src/components/onboarding/validation.ts` - Remove old step references

### School to Merchant Replacements
- [ ] Replace `db.school` → `db.merchant` in subdomain/actions
- [ ] Replace `db.school` → `db.merchant` in join/actions
- [ ] Replace `db.school` → `db.merchant` in location/actions
- [ ] Fix `requireSchoolOwnership` imports (now aliased)

### Completed ✅
- [x] Added `requireSchoolOwnership` alias in auth-security.ts
- [x] Added `getUserSchools`, `getSchoolSetupStatus`, `initializeSchoolSetup` aliases in actions.ts
- [x] Fixed UserRole hierarchy for restaurant roles
- [x] Added `generateRequestId` to logger.ts
- [x] Created congratulations/content.tsx component
- [x] Fixed `use-onboarding.ts` step completion logic

## Next Steps
1. Comment out or simplify code in files using old step names
2. Replace db.school with db.merchant in action files
3. Run build to verify fixes
4. Test all 4 entry points

## Entry Points (4 Total)
1. **SaaS Marketing** - `src/app/[lang]/(marketing)/page.tsx`
2. **SaaS Dashboard** - `src/app/[lang]/(operator)/dashboard/page.tsx`
3. **Merchant Marketing** - `src/app/[lang]/s/[subdomain]/(site)/page.tsx`
4. **Merchant Dashboard** - `src/app/[lang]/s/[subdomain]/(platform)/dashboard/page.tsx`
