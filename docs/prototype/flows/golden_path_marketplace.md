# Golden Path: Marketplace Browse → Order

## Public Flow (No Auth)

### Steps

1. **Navigate**: `/catalogue`
   - **Layout**: Standalone (no AppLayout)
   - **Auth**: Not required
   - **Content**: Product catalogue browser

2. **Navigate**: `/marketplace`
   - **Layout**: Standalone
   - **Auth**: Not required
   - **Content**: Health marketplace with vendor comparison

---

## Authenticated Flow

### Steps

1. **From ModuleHome**: "Health Products & Marketplace" category
   - "Health Products Catalogue" → `/catalogue`
   - "Health Marketplace" → `/marketplace`
   - "Prescription Fulfillment" → `/fulfillment` (roles: doctor, nurse, pharmacist, admin)
   - "Vendor Portal" → `/vendor-portal` (roles: vendor, pharmacist, admin)

2. **Navigate**: `/fulfillment`
   - **Layout**: AppLayout
   - **Sidebar context**: "home"
   - **Content**: Prescription fulfillment with bidding/vendor selection

3. **Navigate**: `/vendor-portal`
   - **Layout**: AppLayout
   - **Sidebar context**: "home"
   - **Content**: Vendor request viewing and bid submission

---

## MSIKA Admin Flow

1. **Navigate**: `/admin/msika-core`
   - **Layout**: AppLayout
   - **Sidebar context**: "admin"
   - **Content**: MSIKA Core product & tariff registry

2. **Navigate**: `/admin/msika-flow`
   - **Content**: MSIKA Flow commerce & fulfillment orchestration
