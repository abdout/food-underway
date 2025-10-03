# Login Page Refactoring Plan - Phone-First Design

## Current State Analysis

### Existing Implementation
- **Location**: `src/app/[lang]/(auth)/login/` and `src/components/auth/login/`
- **Current Flow**: Email/password login with Google & Facebook OAuth
- **Components**: Using shadcn/ui components with consistent styling
- **Structure**: Clean separation between form UI, validation, and server actions

### Key Files Reviewed
1. `src/components/auth/login/form.tsx` - Main login form component
2. `src/components/auth/login/action.ts` - Server action for login logic
3. `src/components/auth/social.tsx` - OAuth buttons (Google & Facebook)
4. `src/components/auth/validation.ts` - Zod schemas for validation
5. `src/components/auth/card-wrapper.tsx` - Reusable card component

## Phase 1 Implementation Status ✅

### Completed Tasks:
1. ✅ **Validation Schema Updates** (`src/components/auth/validation.ts`)
   - Added `PhoneLoginSchema` for phone number validation
   - Created `FlexibleLoginSchema` for future dual-method support
   - Phone validation: minimum 9 digits (Saudi standard)

2. ✅ **Login Form Component** (`src/components/auth/login/form.tsx`)
   - Phone input now default login method
   - Toggle functionality between phone/email methods
   - Country code selector (+966 Saudi Arabia)
   - Basic Figma styling applied
   - Placeholder message for phone login (backend pending)

3. ✅ **Social Component** (`src/components/auth/social.tsx`)
   - Google OAuth remains functional
   - Facebook temporarily disabled (commented out)
   - Updated button styling to match design

4. ✅ **Internationalization**
   - Added Arabic translations for phone-related UI
   - Added English translations
   - Proper RTL support maintained

## Requirements from User

1. **Primary Goal**: Refactor login to match Figma design with phone-first approach
2. **Phase 1 Requirements**:
   - Add phone number as the primary login method
   - Comment out Facebook OAuth (temporary)
   - Add toggle to switch between phone and email login methods
   - When "Sign in with Email" is clicked, show email/password fields in place of phone input
   - Create placeholder UI for phone login
3. **Phase 2 Requirements**:
   - Apply specific Figma styling to email/password fields
   - Further refinements based on exact Figma specifications

## Implementation Plan

### Phase 1: Minimal Changes for Phone Login UI

#### 1. Update Login Form Component (`src/components/auth/login/form.tsx`)

**Add State Management:**
```typescript
const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
```

**Modify Form Structure:**
```typescript
// Replace the current email/password section with conditional rendering
{loginMethod === 'phone' ? (
  <div className="grid gap-4">
    <FormField
      control={form.control}
      name="phone"
      render={({ field }) => (
        <FormItem className="grid gap-2">
          <FormControl>
            <div className="flex gap-2">
              <span className="flex items-center px-3 border rounded-md bg-muted">
                +1
              </span>
              <Input
                {...field}
                type="tel"
                placeholder={dictionary?.auth?.enterPhone || "Enter your phone number"}
                disabled={isPending}
                className="flex-1"
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button
      type="button"
      variant="ghost"
      onClick={() => setLoginMethod('email')}
      className="text-sm text-muted-foreground hover:text-foreground"
    >
      {dictionary?.auth?.signInWithEmail || "Sign in with Email"}
    </Button>
  </div>
) : (
  <>
    {/* Existing email and password fields */}
    <FormField
      control={form.control}
      name="email"
      // ... existing email field
    />
    <FormField
      control={form.control}
      name="password"
      // ... existing password field
    />
    <Button
      type="button"
      variant="ghost"
      onClick={() => setLoginMethod('phone')}
      className="text-sm text-muted-foreground hover:text-foreground"
    >
      {dictionary?.auth?.signInWithPhone || "Sign in with Phone"}
    </Button>
  </>
)}
```

#### 2. Update Validation Schema (`src/components/auth/validation.ts`)

**Add Phone Login Schema:**
```typescript
export const PhoneLoginSchema = z.object({
  phone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^[0-9+\-\s()]+$/, "Invalid phone number format"),
  code: z.optional(z.string()), // For future OTP implementation
});

// Update the main LoginSchema to be flexible
export const LoginSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('email'),
    email: z.string().email("Email is required"),
    password: z.string().min(1, "Password is required"),
    code: z.optional(z.string()),
  }),
  z.object({
    type: z.literal('phone'),
    phone: z.string().min(10, "Phone number required"),
    code: z.optional(z.string()),
  })
]);
```

#### 3. Update Social Component (`src/components/auth/social.tsx`)

**Comment Out Facebook Login:**
```typescript
// In the onClick handler for Facebook button
<Button
  size="lg"
  className="w-full opacity-50 cursor-not-allowed"
  variant="outline"
  onClick={() => {
    // Temporarily disabled
    console.log('Facebook login temporarily disabled');
    // onClick("facebook"); // COMMENTED OUT PER REQUIREMENTS
  }}
  disabled // Add disabled attribute
>
  <svg>...</svg>
  Facebook (Coming Soon)
</Button>
```

#### 4. Update Internationalization

**Add to `src/components/internationalization/en.json`:**
```json
{
  "auth": {
    "phone": "Phone Number",
    "enterPhone": "Enter your phone number",
    "signInWithEmail": "Sign in with Email",
    "signInWithPhone": "Sign in with Phone",
    "orContinueWithPhone": "Or continue with phone",
    "phoneRequired": "Phone number is required",
    "invalidPhone": "Please enter a valid phone number"
  }
}
```

**Add to `src/components/internationalization/ar.json`:**
```json
{
  "auth": {
    "phone": "رقم الهاتف",
    "enterPhone": "أدخل رقم هاتفك",
    "signInWithEmail": "تسجيل الدخول بالبريد الإلكتروني",
    "signInWithPhone": "تسجيل الدخول برقم الهاتف",
    "orContinueWithPhone": "أو تابع برقم الهاتف",
    "phoneRequired": "رقم الهاتف مطلوب",
    "invalidPhone": "الرجاء إدخال رقم هاتف صحيح"
  }
}
```

### Phase 2: Apply Figma Styling (After Getting Design Access)

**Pending Figma Design Details:**
- Exact spacing and padding values
- Color scheme for phone input
- Typography specifications
- Button styles and hover states
- Animation/transition specifications
- Country code selector design
- Error state styling

### Files to Modify

1. **Primary Changes:**
   - `src/components/auth/login/form.tsx` - Add phone UI & toggle logic
   - `src/components/auth/validation.ts` - Add phone validation schema
   - `src/components/auth/social.tsx` - Comment out Facebook

2. **Internationalization:**
   - `src/components/internationalization/en.json` - Add English translations
   - `src/components/internationalization/ar.json` - Add Arabic translations

3. **Future (Phase 2):**
   - `src/components/auth/login/action.ts` - Add phone authentication logic
   - Additional styling files as needed

### Testing Checklist

- [ ] Phone input displays by default
- [ ] Country code shows correctly (+1 for now)
- [ ] Toggle to email method works smoothly
- [ ] Toggle back to phone method works
- [ ] Google OAuth still functional
- [ ] Facebook button is visibly disabled
- [ ] Form validation works for phone numbers
- [ ] Translations work in both English and Arabic
- [ ] Responsive design maintained on mobile
- [ ] No console errors during transitions

### Migration Strategy

1. **Phase 1** (Current):
   - Implement UI changes only
   - Keep authentication backend unchanged
   - Phone login is visual only (submits to existing email auth)

2. **Phase 2** (After Figma):
   - Apply exact Figma styling
   - Add proper animations/transitions
   - Enhance country code selector

3. **Phase 3** (Future):
   - Implement actual phone authentication backend
   - Add SMS/OTP verification
   - Connect to SMS service provider

## Next Steps

1. Access Figma design through MCP server
2. Get exact design specifications
3. Begin Phase 1 implementation
4. Test thoroughly on both desktop and mobile
5. Apply Phase 2 styling once Figma details are available

## Notes

- Following existing codebase patterns and component structure
- Using shadcn/ui components consistently
- Maintaining backward compatibility
- Keeping changes minimal and focused
- Ready to proceed once Figma access is confirmed