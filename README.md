<div align="center">

<img src="assent/bolinha%20de%20tenis.png" alt="Bolinha de tênis" width="120">

# Courtside

**Site institucional de um clube e academia de tênis**

Experiência cinematográfica com vídeo controlado pelo scroll, transições suaves e visual minimalista.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Sem build](https://img.shields.io/badge/build-nenhum-2ea44f?style=flat)

</div>

---

## ✨ Destaques

- **Hero com scroll-scrub** — 96 frames desenhados em `<canvas>` e sincronizados com a rolagem.
- **Rolagem suave** com [Lenis](https://github.com/darkroomengineering/lenis) (v1.1.18, carregado via jsDelivr com SRI).
- **Loader animado** e transições entre páginas.
- **Seções**: Programas & Treinadores, Clube & Eventos, Números, Depoimentos.
- **Modal "Book a Visit"** e menu responsivo acessível.
- **HTML, CSS e JS puros** — sem backend, sem build, sem variáveis de ambiente.

## 🗂️ Estrutura

```
.
├── Html e Css/
│   ├── index.html       # página principal
│   ├── subpage.html     # páginas internas (?id=<página>)
│   └── styles.css
├── Javascripyt/
│   ├── script.js        # interações
│   └── effects.js       # transições
├── assent/              # imagens e vídeos
└── frames-home/         # frames do hero (scroll-scrub)
```

## 🚀 Como executar

Abra `Html e Css/index.html` no navegador (duplo clique) ou sirva a pasta com qualquer servidor estático:

```bash
npx serve .
# ou
python -m http.server 8000
```

Depois acesse `http://localhost:8000/Html%20e%20Css/`.

## 🔒 Notas de segurança

- O formulário **Book a Visit** é apenas um stub: nada é enviado. Ao conectá-lo a um backend, valide e sanitize os dados no servidor e adicione *rate limiting* e CAPTCHA.
- Os cabeçalhos abaixo são recomendados no deploy (não funcionam via `<meta>`):

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; media-src 'self'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

Use também HTTPS com HSTS.

---

<div align="center">
Feito por <a href="https://github.com/Kawasanchezz">Kawasanchezz</a>
</div>
