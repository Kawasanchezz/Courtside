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
├── index.html           # página principal
├── subpage.html         # páginas internas (?id=<página>)
├── css/styles.css
├── js/
│   ├── script.js        # interações
│   ├── subpage.js       # conteúdo das páginas internas
│   ├── boot.js          # trava o scroll antes da 1ª pintura
│   └── effects.js       # transições
├── assent/              # imagens e vídeos
├── _headers / vercel.json  # cabeçalhos de segurança
├── SECURITY.md          # checklist de segurança
└── frames-home/         # frames do hero (scroll-scrub)
```

---

<div align="center">
Feito por <a href="https://github.com/Kawasanchezz">Kawasanchezz</a>
</div>

## 📄 Licença

Distribuído sob a licença [MIT](LICENSE). © 2026 [Kawasanchezz](https://github.com/Kawasanchezz) — projeto criado e desenvolvido por mim.
