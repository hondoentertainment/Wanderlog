---
name: ux_audit
description: Check if the site adheres to the strongest UX standards (Midnight Sapphire/Quietly Premium)
---

# UX Audit Skill

Use this skill to perform a semantic and visual audit of the application to ensure it meets the highest standards of user experience, specifically tailored for the **Midnight Sapphire** and **Quietly Premium** design systems.

## Core Pillars

### 1. Aesthetic Fidelity (Midnight Sapphire)
- **Glassmorphism**: Ensure containers use `backdrop-filter: blur()`, semi-transparent backgrounds, and subtle borders.
- **Luminosity**: Look for radial gradients and "drop-glows" instead of flat shadows.
- **Micro-interactions**: Check for magnetic hover effects (scaling, lifting) and smooth transitions.
- **Staggered Entrances**: Verify that lists and grids load with sequential animation delays.

### 2. Cognitive Load (Quietly Premium)
- **Omni-Box**: Check if multiple inputs can be consolidated into a single intelligent search/command field.
- **Ghost Onboarding**: Ensure users can derive value before forced authentication.
- **Information Density**: verify that "sparse" data is handled gracefully (no crashes on null fields).

### 3. Accessibility & Performance
- **Contrast**: Ensure text is readable against glassmorphic backgrounds.
- **Touch Targets**: Buttons and interactive elements should be at least 44x44px.
- **Lazy Loading**: Verify that heavy components or images use progressive loading or placeholders.

## Audit Workflow

1. **Scan UI Components**: Examine `src/components` or major view files for design system compliance.
2. **Review Data Handling**: Audit services and hooks for defensive coding patterns (nullish coalescing).
3. **Verify Interactive State**: Run the app (or simulate) to check for kinetic feedback on buttons and inputs.
4. **Report Findings**: Use the `ux_checklist.md` template to generate a report.

## Related Resources
- [UX Checklist](file:///C:/Users/kyle/OneDrive/Desktop/Wanderlog/.agent/skills/ux_audit/resources/ux_checklist.md)
