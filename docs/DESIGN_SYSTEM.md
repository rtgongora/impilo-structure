# Impilo EHR Design System & Standards

## Overview

The Impilo EHR prototype follows a **clinical/medical interface** design philosophy that prioritizes:
- **Professional appearance** - Trust-inspiring, clean aesthetics
- **High contrast** - Accessibility and readability in clinical environments
- **Semantic color usage** - Clear visual hierarchy for critical information
- **Responsive design** - Works across desktop, tablet, and mobile devices

---

## Technology Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | Component framework |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first styling |
| **Shadcn/UI** | Pre-built accessible components |
| **Framer Motion** | Animations and transitions |
| **Lucide React** | Icon library |
| **Supabase** | Backend (Cloud) |

---

## Typography

### Font Families

```css
--font-sans: 'Work Sans'    /* Primary UI font */
--font-mono: 'Inconsolata'  /* Code, timestamps, IDs */
--font-serif: 'Lora'        /* Document/narrative content */
```

### Usage Guidelines

| Context | Font | Weight |
|---------|------|--------|
| Headings | Work Sans | 600-700 |
| Body text | Work Sans | 400-500 |
| Timestamps/Elapsed time | Inconsolata | 400 |
| Clinical notes/Documents | Lora | 400-500 |
| Code/Technical IDs | Inconsolata | 400 |

### Tailwind Classes

```tsx
<h1 className="font-sans font-semibold">Heading</h1>
<p className="font-sans">Body text</p>
<span className="font-mono">VARAPI-2025-ZW000001-A1B2</span>
<p className="font-serif">Clinical narrative...</p>
```

---

## Color System

All colors are defined in **HSL format** for consistency and theming support.

### Core Palette

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--background` | 0 0% 96% | 0 0% 9% | Page background |
| `--foreground` | 0 0% 9% | 0 0% 98% | Primary text |
| `--card` | 0 0% 98% | 0 0% 14% | Card backgrounds |
| `--card-foreground` | 0 0% 9% | 0 0% 98% | Card text |

### Brand Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--primary` | 161 93% 30% | 158 64% 51% | Primary actions, branding (Teal) |
| `--primary-foreground` | 151 80% 95% | 165 91% 9% | Text on primary |
| `--secondary` | 0 0% 32% | 0 0% 45% | Secondary actions |
| `--accent` | 166 76% 96% | 178 84% 10% | Highlights, active states |

### Clinical Status Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--critical` | 0 85% 50% | Emergency, critical alerts |
| `--success` | 145 65% 40% | Completed, positive outcomes |
| `--warning` | 38 92% 50% | Caution, pending items |
| `--destructive` | 0 72% 50% | Delete, cancel actions |

### Tailwind Usage

```tsx
// Use semantic tokens, NEVER hardcode colors
<Button className="bg-primary text-primary-foreground" />
<Badge className="bg-critical text-critical-foreground" />
<div className="bg-success-muted text-success" />
<span className="text-warning" />
```

---

## Layout System

### Specialized Layout Areas

| Token | Purpose |
|-------|---------|
| `--sidebar-*` | Navigation sidebar styling |
| `--topbar-*` | Header/patient banner area |
| `--encounter-*` | Encounter menu sections |
| `--workspace-*` | Main clinical workspace |

### Container

```tsx
// Centered container with max-width
<div className="container">...</div>

// Configuration: max-width 1400px, padding 2rem
```

### Border Radius

| Token | Value |
|-------|-------|
| `--radius` | 0.75rem (12px) |
| `rounded-lg` | var(--radius) |
| `rounded-md` | calc(var(--radius) - 2px) |
| `rounded-sm` | calc(var(--radius) - 4px) |

---

## Component Guidelines

### Buttons

```tsx
// Primary action
<Button>Save</Button>

// Secondary action
<Button variant="secondary">Cancel</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// Ghost button
<Button variant="ghost">More Options</Button>

// Outline button
<Button variant="outline">Export</Button>
```

### Cards

```tsx
<Card>
  <CardHeader>
    <CardTitle>Patient Summary</CardTitle>
    <CardDescription>Overview of current status</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

### Badges

```tsx
// Status indicators
<Badge variant="default">Active</Badge>
<Badge variant="secondary">Pending</Badge>
<Badge variant="destructive">Critical</Badge>
<Badge variant="outline">Draft</Badge>
```

### Toast Notifications

```tsx
import { toast } from "@/hooks/use-toast";

// Success
toast({ title: "Saved", description: "Changes saved successfully" });

// Error
toast({ title: "Error", variant: "destructive", description: "Failed to save" });
```

---

## Animations

### Keyframe Animations

| Animation | Duration | Usage |
|-----------|----------|-------|
| `accordion-down` | 0.2s | Accordion expand |
| `accordion-up` | 0.2s | Accordion collapse |
| `fade-in` | 0.2s | Element fade in |
| `scale-in` | 0.2s | Modal/dialog appear |
| `slide-in-right` | 0.3s | Drawer from right |
| `slide-in-left` | 0.3s | Drawer from left |

### Clinical-Specific Animations

```css
/* Critical event pulsing indicator */
.critical-pulse {
  animation: critical-pulse 1.5s ease-in-out infinite;
}

/* Critical workspace border flash */
.critical-mode {
  animation: critical-border-flash 2s ease-in-out infinite;
}
```

### Tailwind Usage

```tsx
<div className="animate-fade-in">Fading in...</div>
<div className="animate-slide-in-right">Sliding from right...</div>
<button className="critical-pulse">Emergency Action</button>
```

### Transition Helper

```tsx
// Smooth clinical transitions
<div className="transition-clinical">
  {/* Elements with 200ms ease-out transition */}
</div>
```

---

## Dark Mode

The design system fully supports dark mode via the `.dark` class.

### Implementation

```tsx
// In layout/root component
import { ThemeProvider } from "next-themes";

<ThemeProvider attribute="class" defaultTheme="system">
  <App />
</ThemeProvider>
```

### Key Differences

| Element | Light | Dark |
|---------|-------|------|
| Background | Light gray (96%) | Near black (9%) |
| Cards | White (98%) | Dark gray (14%) |
| Primary | Deep teal | Brighter teal |
| Borders | Light gray | Dark gray |

---

## Shadows

Shadow tokens are defined in CSS variables for consistency:

| Token | Usage |
|-------|-------|
| `shadow-2xs` | Subtle elevation |
| `shadow-xs` | Minimal elevation |
| `shadow-sm` | Light elevation |
| `shadow-md` | Medium elevation |
| `shadow-lg` | High elevation |
| `shadow-xl` | Maximum elevation |

---

## Scrollbar Styling

Custom scrollbar styling for a polished appearance:

```css
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-muted;
}

::-webkit-scrollbar-thumb {
  @apply bg-muted-foreground/30 rounded-full;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-muted-foreground/50;
}
```

---

## Icons

Using **Lucide React** for consistent iconography.

```tsx
import { Heart, AlertCircle, CheckCircle } from "lucide-react";

<Heart className="h-4 w-4" />
<AlertCircle className="h-5 w-5 text-warning" />
<CheckCircle className="h-5 w-5 text-success" />
```

### Size Guidelines

| Context | Size |
|---------|------|
| Inline with text | h-4 w-4 |
| Button icons | h-4 w-4 or h-5 w-5 |
| Card headers | h-5 w-5 |
| Large feature icons | h-8 w-8 or larger |

---

## Accessibility Standards

### Color Contrast
- All text meets **WCAG 2.1 AA** standards (4.5:1 for normal text, 3:1 for large text)
- Critical colors are distinguishable without relying on color alone

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Focus states are clearly visible using `ring` color

### Screen Reader Support
- Semantic HTML structure
- ARIA labels on interactive elements
- Descriptive alt text for images

---

## File Organization

```
src/
├── components/
│   ├── ui/           # Shadcn base components
│   ├── auth/         # Authentication components
│   ├── ehr/          # EHR-specific components
│   ├── layout/       # Layout components
│   └── ...
├── hooks/            # Custom React hooks
├── contexts/         # React contexts
├── pages/            # Route pages
├── lib/              # Utility functions
└── index.css         # Design system tokens
```

---

## Best Practices

### DO ✅

- Use semantic color tokens (`bg-primary`, `text-foreground`)
- Use component variants from Shadcn/UI
- Follow responsive design patterns
- Add appropriate loading states
- Use toast notifications for user feedback

### DON'T ❌

- Hardcode colors (`bg-[#123456]`, `text-white`)
- Skip dark mode considerations
- Create inline styles for theming
- Ignore accessibility requirements
- Override component styles without reason

---

## Code Examples

### Complete Component Example

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const VitalsCard = ({ patient }) => {
  const handleSave = () => {
    toast({ title: "Vitals saved", description: "Patient vitals recorded" });
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-critical" />
          Vital Signs
        </CardTitle>
        <Badge variant={patient.status === 'critical' ? 'destructive' : 'default'}>
          {patient.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span className="font-mono">Last updated: 2 min ago</span>
          </p>
          {/* Vitals content */}
        </div>
        <Button onClick={handleSave} className="mt-4 w-full">
          Save Vitals
        </Button>
      </CardContent>
    </Card>
  );
};
```

---

## Version

**Design System Version:** 1.0.0  
**Last Updated:** December 2024  
**Prototype:** Impilo EHR
