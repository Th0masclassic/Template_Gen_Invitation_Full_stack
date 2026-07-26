# Wedding + Baby Shower update

## Added
- Event selector: `wedding` or `baby_shower`.
- Pack selector: `/Full_pack` or `/template_only_pack`.
- Custom Template Import mode with a dedicated image upload.
- 10 baby shower invitation templates under `public/assets/templates/baby-shower/`.
- Event-aware GPT image editing prompt.
- Template-only packs skip website/PDF generation and continue to Canva template creation.

## Kept unchanged
- Existing Canva `create_url` handling.
- Existing wedding templates and wedding flow.
- Photo upload as an optional second image.

## Upload fix v3
- Fixed `MulterError` when Custom Template Import sent both `customTemplate` and `photo`.
- Multer now accepts up to two files, one for each supported field.
- Validation errors now identify the correct field and provide clearer upload messages.


## V4 - Canva authorization order fix
- ChatGPT + Canva Image To Design now runs before Canva Connect API authorization is required.
- The editable design ID/link is saved first; OAuth is used only to publish the Brand Template create_url.
- After OAuth, pending ChatGPT-created designs resume publication without creating a flat-image replacement.
- The Canva handoff opens in a fresh ChatGPT browser tab.

## V5 ChatGPT startup session check

The server now verifies the persistent ChatGPT session before processing Canva jobs. Missing sessions open the login browser automatically, pause the Canva queue, and resume it after authentication is detected.
