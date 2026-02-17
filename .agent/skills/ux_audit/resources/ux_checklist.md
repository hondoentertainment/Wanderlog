# UX Audit Checklist

## 🎨 Visuals (Midnight Sapphire)
- [ ] Elements use `backdrop-filter: blur(12px)` or higher?
- [ ] Borders are subtle (`rgba(255, 255, 255, 0.1)`)?
- [ ] Backgrounds use radial gradients instead of flat hex codes?
- [ ] Active icons or brand elements have "drop-glows"?
- [ ] Typography uses 'Outfit' for headers and 'Inter' for body?

## ⚡ Interactions
- [ ] Buttons use `scale(0.95)` on active?
- [ ] Hover states use `transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)`?
- [ ] Lists/Grids have staggered entrance animations?
- [ ] Loading states are branded and avoid "naked" data flashes?

## 🧠 Cognitive Flow
- [ ] Primary action is clearly distinguished?
- [ ] Consolidation of inputs into an Omni-Box where possible?
- [ ] Ghost Mode available for new users?
- [ ] Error messages are helpful and follow the "terminal" diagnostic aesthetic if technical?

## 🛠️ Resilience (Defensive Patterns)
- [ ] All list rendering uses `(list || []).map()`?
- [ ] Property access uses optional chaining `item?.prop`?
- [ ] Fallback UI for empty states?

## ♿ Accessibility
- [ ] Color contrast meets WCAG AA for text?
- [ ] Focus states are highly visible (luminous border)?
- [ ] Interactive elements have ARIA labels where text is absent?
