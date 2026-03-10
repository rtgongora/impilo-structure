# Golden Path: Login → ModuleHome

## Flow 1: Staff Email Login

### Steps

1. **Navigate**: `/auth`
2. **Screen**: Split layout
   - Left: gradient branding panel with "Digital Health Platform" heading (hidden on mobile)
   - Right: method select with 3 visible buttons
3. **See buttons**:
   - "Provider ID & Biometric" (Fingerprint icon)
   - "Patient Portal" (UserCircle icon)
   - "Staff Email Login" (Mail icon)
4. **Click**: "Staff Email Login"
5. **Screen changes to**: Email login card
   - Card title: "Sign in"
   - Card description: "Enter your email and password to continue"
6. **Enter email**: `sarah.moyo@impilo.health`
   - Field label: "Email address"
   - Placeholder: "you@example.com"
7. **Enter password**: `Impilo2025!`
   - Field label: "Password"
   - Placeholder: "••••••••"
   - "Forgot password?" link visible
8. **Click**: "Sign In" button
   - Button shows: "Signing in..." with spinner while loading
9. **API calls**:
   - `track-login-attempt` edge function (pre-check)
   - `supabase.auth.signInWithPassword`
   - `track-login-attempt` edge function (success)
10. **Toast**: "Welcome back!" / "You have been logged in successfully."
11. **Navigate**: `/` (ModuleHome)
12. **Screen**: Full-screen module hub
    - Header: Impilo logo + user avatar dropdown
    - Tabs: "Work", "My Professional", "My Life"
    - Active tab: "Work" (default for providers)
    - Content: WorkplaceSelectionHub (if no facility selected) OR module grid

---

## Flow 2: Provider ID & Biometric Login

### Steps

1. **Navigate**: `/auth`
2. **Click**: "Provider ID & Biometric"
3. **Screen**: ProviderIdLookup component
4. **Enter Provider ID** and facility
5. **Screen**: BiometricAuth component
   - Required methods: fingerprint, facial, iris
6. **Complete biometric**: verification
7. **Screen**: WorkspaceSelection component
   - Select department, physical workspace, optional workstation
8. **API calls**:
   - Profile lookup by provider_registry_id
   - `supabase.auth.signInWithPassword` (demo credentials)
   - Session creation in `user_sessions`
   - `provider_registry_logs` insert (biometric_login)
   - `geolocate-ip` edge function
9. **sessionStorage set**: `activeWorkspace` = `{department, physicalWorkspace, workstation, facility, loginTime}`
10. **Toast**: "Welcome, {fullName}!" / "Logged in to {department} at {workstation}"
11. **Navigate**: `/` (ModuleHome)

---

## Flow 3: System Maintenance Login

### Steps

1. **Navigate**: `/auth?mode=maintenance` OR press `Ctrl+Shift+M` OR long-press mobile logo (1500ms)
2. **Toast** (on reveal): "Maintenance mode revealed"
3. **See**: 4th button appears — "System Maintenance" (amber styled, Wrench icon)
4. **Click**: "System Maintenance"
5. **Screen**: SystemMaintenanceAuth component
