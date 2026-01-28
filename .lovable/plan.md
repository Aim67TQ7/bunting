
# Add Privacy Policy and Terms of Use Pages

## Overview
Create two new legal pages (Privacy Policy and Terms of Use) in this webapp that can be displayed either as standalone pages or within the iframe viewer pattern.

## Implementation Steps

### Step 1: Create Privacy Policy Page
**New File: `src/pages/Privacy.tsx`**

Create a styled page with:
- PageLayout wrapper for consistent sidebar navigation
- Professional legal content layout
- Sections for data collection, usage, security, cookies, third parties, etc.
- Company branding (BuntingGPT/Bunting Magnetics)
- Last updated date
- Contact information

### Step 2: Create Terms of Use Page
**New File: `src/pages/Terms.tsx`**

Create a styled page with:
- PageLayout wrapper
- Sections for acceptance, user responsibilities, intellectual property, disclaimers, limitations
- Governing law clause
- Contact information

### Step 3: Add Routes to App.tsx
**File: `src/App.tsx`**

Add two new routes:
```text
/privacy  → Privacy page
/terms    → Terms page
```

### Step 4: Integration with Notes App
The notes.buntinggpt.com site (external) needs to be updated separately to:
- Replace "Network Stable" link with Privacy link pointing to: `/privacy`
- Replace "Security Active" link with Terms link pointing to: `/terms`
- Update "Central Access Hub" text to "Now Available as an App in Teams"
- Make "core v. 4.1.1" clickable showing changelog dialog

Since notes.buntinggpt.com is a separate codebase, those changes need to be made there. The hyperlinks from notes should use this pattern to open within the iframe:
```
/iframe?url=https://buntinggpt.com/privacy&title=Privacy%20Policy
```
Or they can link directly if notes is the entry point.

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/Privacy.tsx` | **CREATE** - Privacy Policy page |
| `src/pages/Terms.tsx` | **CREATE** - Terms of Use page |
| `src/App.tsx` | **MODIFY** - Add routes for /privacy and /terms |

---

## Page Design

Both pages will follow this structure:
- Dark theme compatible
- Scrollable content area
- Professional typography
- Clear section headings
- Return to Home button
- Mobile responsive

---

## Technical Notes

### Privacy Page Sections
1. Introduction
2. Information We Collect
3. How We Use Information
4. Data Security
5. Cookies and Tracking
6. Third-Party Services
7. Your Rights
8. Contact Information

### Terms Page Sections
1. Acceptance of Terms
2. Use of Service
3. User Accounts
4. Intellectual Property
5. Disclaimers
6. Limitation of Liability
7. Governing Law
8. Changes to Terms
9. Contact Information

---

## Notes App Update (Separate Codebase)
The following changes are needed on notes.buntinggpt.com (not in this codebase):
- "Network Stable" → Link to `/privacy` or `/iframe?url=...privacy...`
- "Security Active" → Link to `/terms` or `/iframe?url=...terms...`
- "Central Access Hub" → "Now Available as an App in Teams"
- "core v. 4.1.1" → Clickable with changelog popup showing MS365 Teams integration update
