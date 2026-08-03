# Etsy gallery image-generation prompt set

Mode: OpenAI built-in image generation, followed by a deterministic 2,400 × 2,400 px sRGB production resize. The RSVP dashboard image received one precise edit so `TOTAL 110 = YES 89 + NO 21`.

## Reference-image roles

- `AnuncioEtsy.png`, `2b3d84ea-7067-47e8-83a3-50c5500aed66.png`, and `Wedding Design Announcement 01 (1).png`: visual-style and product-context references only.
- `b7b996e4-23fd-40b3-9eaa-ac1a2a13e585.png`: visual-style reference only; its sales totals and sample testimonials were expressly excluded.
- `public/assets/templates/01_editorial_photo.png`, `03_sage_botanical.png`, `05_ivory_silk.png`, `08_coastal_blue.png`, and `09_terracotta_boho.png`: real design references for the style-selection image.

## Shared art direction

Use case: `ads-marketing`. Create a square, premium Etsy listing image for InviteLab. Use luminous warm ivory silk, champagne gold, soft cream, restrained white florals, and charcoal typography. Blend photorealistic luxury device/stationery mockups with uncluttered editorial design. Keep a 7% safe margin and make the hierarchy readable at thumbnail size. Render required copy exactly once. Add no other legible copy except a small `InviteLab` signature. Never include a sales count, rating, review, testimonial, bestseller badge, unsupported turnaround/revision claim, watermark, or unrelated logo.

## Image-specific prompts

### 01 — Complete digital wedding invitation

Show a realistic laptop with a coordinated wedding website and a smartphone with a full-screen ivory envelope and gold wax seal. Headline: `THE COMPLETE DIGITAL WEDDING INVITATION`. Secondary line: `WEBSITE • RSVP • INTERACTIVE PDF • CANVA TEMPLATE`.

### 02 — Everything in one pack

Show one centered invitation phone surrounded by five spacious icon tiles. Headline: `EVERYTHING IN ONE BEAUTIFUL PACK`. Feature labels: `INVITATION`, `WEBSITE`, `RSVP`, `INTERACTIVE PDF`, `CANVA TEMPLATE`.

### 03 — RSVP dashboard

Show a laptop with a clean RSVP Admin dashboard and a phone with the guest RSVP form. Headline: `RSVP, WITHOUT THE SPREADSHEET CHAOS`. Secondary line: `TRACK YES • NO • GUEST DETAILS`. Dashboard labels and values: `TOTAL 110`, `YES 89`, `NO 21`, plus `GUESTS`. Keep all guest rows anonymized.

### 04 — Interactive PDF envelope

Show two phones: a closed, full-height embossed envelope with a centered gold seal, then the revealed invitation. Connect them with a tap gesture and arrow. Headline: `AN INVITATION THEY'LL WANT TO OPEN`. Secondary line: `CLICK THE SEAL • REVEAL THE INVITE`. Badge: `INTERACTIVE PDF`. The envelope must cover the phone screen from top to bottom.

### 05 — Responsive devices

Show one coherent wedding website adapted naturally across laptop, tablet, and smartphone. Headline: `BEAUTIFUL ON EVERY SCREEN`. Secondary line: `MOBILE • TABLET • DESKTOP`.

### 06 — Wedding website features

Show a laptop with an elegant agenda and a phone with a countdown, supported by large gold line icons. Headline: `EVERY DETAIL. ONE BEAUTIFUL PLACE.` Secondary line: `COUNTDOWN • AGENDA • MAP • MUSIC • CALENDAR`.

### 07 — Signature styles

Faithfully present the five supplied real invitation designs as a clean premium gallery. Headline: `MADE TO MATCH YOUR WEDDING`. Secondary line: `10 SIGNATURE STYLES • OR IMPORT YOUR OWN`.

### 08 — Guided order process

Show four connected process cards with clear icons. Headline: `FROM YOUR DETAILS TO READY TO SHARE`. Step labels: `1. CHOOSE`, `2. PERSONALIZE`, `3. APPROVE`, `4. SHARE`. Secondary line: `A SIMPLE, GUIDED DIGITAL EXPERIENCE`.

### 09 — Editable Canva template

Show a realistic tablet with a generic design editor and invitation layers, plus a phone with the finished invitation. Do not render the Canva logo. Headline: `MAKE IT YOURS IN CANVA`. Secondary line: `NAMES • WORDING • COLORS • PHOTOS`. Badge: `EDITABLE TEMPLATE`.

### 10 — Made-to-order digital product

Show an invitation suite, a phone with the sealed envelope, and three assurance icons. Headline: `MADE TO ORDER. MADE FOR YOU.` Secondary line: `DIGITAL PRODUCT • NOTHING SHIPPED`. Labels: `PERSONALIZED`, `DIGITAL DELIVERY`, `PRIVATE ACCESS`. Do not imply instant delivery.

## RSVP correction prompt

Change only the dashboard's large `TOTAL` value from `128` to `110`, so it equals `YES 89` plus `NO 21`. Preserve every other element, word, layout, color, shadow, device, and background unchanged.
