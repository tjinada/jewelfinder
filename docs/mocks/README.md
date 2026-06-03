# Mockups

Mobile-first mock screens for Jewel Finder. Theme: **Ivory & Peacock** — neutral ivory
canvas, peacock-teal primary, coral accent, champagne-gold detailing, serif display type.
Jewelry imagery is gold line-art standing in for real photos. Floating chrome uses frosted
**glass accents** (see `../DESIGN.md`).

## Static screens (SVG)

> These were drawn in the original maroon palette and are kept as a record of layout. The
> HTML prototypes below are the current source of truth for colour + glass.

| File | Screen |
|------|--------|
| `01-home-grid.svg` | Home — grid of available jewelry, category chips, set badges |
| `02-search-filters.svg` | Search — category-driven filters (Necklaces shown) |
| `03-upload.svg` | Add jewelry — photos + category-driven fields |
| `04-item-detail.svg` | Item detail — owner, availability, attributes, set banner |
| `05-set-view.svg` | Set view — all pieces in a matching set |
| `06-messaging.svg` | Messaging — thread anchored to an item |

## Interactive prototypes (HTML)

| File | Contents |
|------|----------|
| `prototype.html` | Ivory & Peacock theme. Four screens wired together: Home → Item detail → Set view, plus the config-driven Add-jewelry form. |
| `item-detail-glass.html` | Item detail with a **Glass / Flat** toggle, demonstrating the approved frosted-chrome treatment over a colour-rich hero. |

Open either in any browser. No build step, no dependencies, no network calls.

### prototype.html flows
- Home grid → tap a card → **Item detail** → **View set** → **Set view** (pieces tap back).
- Bottom-nav **+** → **Add jewelry**, where changing **Category** live-rebuilds the fields
  from the same `CATEGORY_ATTRIBUTES` config the real app will use; the availability toggle
  flips Available / On loan.
