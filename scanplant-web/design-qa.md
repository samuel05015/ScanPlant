# ScanPlant design QA

## Comparison target

- Source visual truth: user-provided home-screen screenshot attached in the conversation (1920 x 872 px; the chat renderer did not expose a workspace file path).
- Intended change: preserve the existing ScanPlant design while adding comfortable brand spacing, distinct typography for the requested headings, and a fully visible sign-out control.
- Implementation screenshot: `D:\UserData\sh050\Downloads\ScanPlant\scanplant-web\qa-home-1920x872.png`.
- Additional responsive evidence: `qa-home-1366x768-final.png` and `qa-home-390x844-final.png`.
- Production evidence: `qa-live-1920x872.png` captured from `https://scan-plant-front-back-end.vercel.app/` after deployment.
- CSS viewport and image density: 1920 x 872, 1366 x 768, and 390 x 844 CSS px; screenshots use the same pixel dimensions with `deviceScaleFactor: 1`.
- State: authenticated home screen using a temporary local visual-test token; no real credentials or persisted production session were used.

## Full-view comparison evidence

- At 1920 x 872, the supplied ScanPlant logo is centered in the sidebar and the visible brand mark has comfortable top and side spacing.
- At 1366 x 768, all eight desktop navigation entries and the complete `Sair com segurança` action remain visible without clipping.
- At 390 x 844, the desktop sidebar is hidden, the mobile navigation is visible, and both requested heading groups remain readable without horizontal overflow.
- The hero, color palette, content hierarchy, corner radii, and image crop remain consistent with the reference screen.

## Focused region comparison evidence

- Brand region: checked the logo wrapper and inspected the rendered PNG crop; its wrapper begins at least 20 px below the viewport edge in the short desktop layout.
- Heading regions: computed styles confirm `Marcellus` for `Bem-vindo ao ScanPlant.` and `Tudo para cuidar e aprender`; the matching eyebrow labels use the same editorial family with controlled uppercase spacing.
- Sidebar footer: the sign-out button bounding box remains fully inside the 768 px viewport.
- A separate focused comparison was not needed for the hero because its asset, crop, copy, and layout were intentionally unchanged.

## Required fidelity surfaces

- Fonts and typography: passed. Marcellus is loaded for only the four requested texts; Manrope remains the body/control font and Fraunces remains the hero display font. No unwanted wrapping or truncation was found.
- Spacing and layout rhythm: passed. Logo spacing, sidebar structure, header spacing, hero proportions, section gaps, radii, and footer position are consistent across the tested breakpoints.
- Colors and visual tokens: passed. The existing green/ivory palette and semantic tokens were preserved.
- Image quality and asset fidelity: passed. The supplied real logo and existing hero raster remain sharp, proportionally cropped, and free of visible transparency halos.
- Copy and content: passed. The requested text is unchanged and accents render correctly.

## Findings

- No actionable P0, P1, or P2 visual differences remain.
- P3 follow-up: the original logo PNG contains substantial transparent canvas. A future export tightly cropped around the artwork would simplify the CSS framing, but the current rendered result is visually correct.

## Interaction and runtime checks

- Playwright: 3 tests passed.
- Primary interaction: `Identificar uma planta` navigates to `/photo`.
- Desktop and mobile navigation controls are rendered as interactive links/buttons.
- Browser page errors: none in the clean run.
- The invalid legacy import map, unused Tailwind CDN loader, and duplicate obsolete entry script were removed from `index.html` after they were detected during QA.
- Production build: passed.
- Production browser verification: passed; title, home heading, sign-out visibility, Marcellus loading, and page-error collection all passed on the live URL.

## Comparison history

1. Initial check was blocked because no connected browser was available.
2. User authorized local Playwright verification. First visual captures confirmed the spacing and typography changes and exposed stale HTML loaders.
3. The stale loaders were removed and the test was rerun in a clean browser state.
4. The final Playwright run passed at 1920 x 872, 1366 x 768, and 390 x 844 with no P0/P1/P2 findings.
5. The user supplied a login-field screenshot showing email and lock icons overlapping entered text and requested more logo-to-navigation spacing.
6. The revised login was captured at 1366 x 768 and 390 x 844. Computed input padding is 50 px on the icon side and 56 px on the password-action side; geometry checks confirm at least 8 px of separation between icons and the value area.
7. The registration fields were checked with the same reserved icon spacing. The desktop home capture at 1366 x 768 confirms a 20 px logo-to-navigation gap while the sign-out action remains fully visible.
8. Browser page errors remained empty. No new P0, P1, or P2 findings were found.
9. The user supplied a full login screenshot showing the logo wordmark clipped at the bottom and a small document scrollbar. The login-specific viewport layout and compact logo frame were revised.

## Latest iteration evidence

- Source visual truth: user-provided login crop attached in the conversation, showing icon/text overlap.
- Login implementation: `qa-login-icons-1366x768.png` and `qa-login-icons-390x844.png`.
- Sidebar implementation: `qa-logo-nav-spacing-1366x768.png`.
- Interaction state: populated email and password inputs with the password concealed and visibility action available.
- Responsive result: passed on desktop and mobile.
- Production confirmation: `qa-live-login-icons-1366x768.png`; the live site reports 50 px left padding, 56 px password-action padding, a 20 px brand-to-navigation gap, and zero page errors.

## Fixed login viewport iteration

- Source visual truth: user-provided login screenshot attached in the conversation (approximately 852 x 869 px), showing the clipped compact logo and a visible document scrollbar.
- Implementation screenshots: `qa-login-fixed-852x869.png` and `qa-login-fixed-682x695.png`.
- The compact logo wrapper is 106 px high at the supplied viewport and 102 px in the short-height mode; the complete ScanPlant wordmark is visible with clear space below it.
- At 852 x 869, the document, body, and login panel all measure 869 px high; the card ends at 764.375 px and no document or panel scrolling is available.
- At 682 x 695, the document, body, and login panel all measure 695 px high; the card ends at 625.375 px and no document or panel scrolling is available.
- Input protection remained intact: computed padding is 50 px at the email-icon side and 56 px at the password-action side.
- Visual inspection confirmed that the full registration prompt remains visible, spacing is balanced, and the logo is not clipped.
- Production build: passed. Browser page errors: none.
- Production confirmation: `qa-live-login-fixed-852x869.png`; the public alias reports a 106 px compact logo wrapper, document and panel heights equal to the 869 px viewport, a fully visible card ending at 764.375 px, and zero page errors.

final result: passed
