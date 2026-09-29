# Courtside — site estático

HTML/CSS/JS puro, sem backend, sem build, sem variáveis de ambiente.

- `Html e Css/index.html` — página principal; `subpage.html?id=<página>` — páginas internas.
- `Javascripyt/` — `script.js` (interações), `effects.js` (transições).
- `assent/` — imagens e vídeos; `frames-home/` — 96 frames do hero (scroll-scrub).
- Abrir: duplo-clique em `index.html` ou servir a pasta com qualquer servidor estático.
- Formulário "Book a visit" é um stub: nada é enviado. Ao ligar a um backend, valide/sanitize no servidor, adicione rate limiting e CAPTCHA.
- Lenis é carregado via jsDelivr com SRI (versão fixa 1.1.18).

## Cabeçalhos recomendados no deploy (não funcionam via `<meta>`)
`Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; media-src 'self'; frame-ancestors 'none'`
`X-Content-Type-Options: nosniff` · `Referrer-Policy: strict-origin-when-cross-origin` · HTTPS + HSTS.
# Site-T-nis-
