# Segurança — Courtside

Site 100% estático (HTML, CSS e JS puros): **não há servidor, banco, login, API própria nem `.env`**.
Cada item do checklist abaixo indica o que foi feito ou por que não se aplica.

| # | Item | Status |
|---|------|--------|
| 1 | Chave de API protegida | N/A — nenhuma chave no código. Se surgir uma API, a chave fica no servidor, nunca no front |
| 2 | `.env` nunca exposto | `.env`, `.env.*` e variantes no `.gitignore`; histórico do Git verificado, sem segredos |
| 3 | Nada de senha no código | Verificado em todo o código e no histórico |
| 4 | Login de verdade | N/A — não há área logada |
| 5 | Permissão no servidor | N/A — sem backend. Ao criar um, autorização sempre no servidor |
| 6 | Não confia no ID da tela | `?id=` da subpage só aceita chaves existentes em `PAGES` (`Object.hasOwn`) |
| 7 | Cada um só vê o seu | N/A — não há dados por usuário |
| 8 | Banco travado | N/A — sem banco |
| 9 | Firebase/Supabase/storage | N/A — não usados; `.firebase/` e service accounts já ignorados |
| 10 | Admin protegido | N/A — não há painel admin |
| 11 | Debug desligado | Sem `console.log`/modo debug em produção |
| 12 | Erro sem detalhe | Nada exibe stack/erro ao usuário; 404 é a genérica da hospedagem |
| 13 | Valida tudo no servidor | Formulário é stub (não envia nada). Validação no cliente é só UX e **deve ser repetida no servidor** quando houver backend |
| 14 | Limpa o que o usuário manda | `textContent` no lugar de `innerHTML`; `escapeHTML()` em todo template; remoção de caracteres de controle; `form-action 'none'` |
| 15 | Upload protegido | N/A — sem upload |
| 16 | Sem injeção de SQL | N/A — sem banco |
| 17 | Limite de tentativas | Formulário: 5 tentativas/sessão, 30 s entre envios, honeypot anti-bot. Rate limit real precisa ser no servidor/CDN |
| 18 | Git sem senha vazada | `.gitignore` reforçado (chaves, `.npmrc`, dumps, credenciais) |
| 19 | Headers e CORS certos | CSP estrita (sem `unsafe-inline` em scripts), HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP em `_headers` e `vercel.json`; CSP também via `<meta>` como reserva. Sem CORS aberto |
| 20 | Testa como um estranho | Ver "Como testar" |
| 21 | Auditoria completa | Revisão feita com IA; refazer a cada mudança relevante |

Dependência externa: Lenis via jsDelivr com **SRI** (`integrity`) e versão fixa. Fontes do Google Fonts liberadas na CSP.

## Como testar
- Abra o site e confira o console: nenhuma violação de CSP deve aparecer.
- `https://securityheaders.com` e `https://observatory.mozilla.org` na URL publicada.
- Tente `subpage.html?id=<script>alert(1)</script>` e `?id=__proto__` — deve cair em "Page not found".
- Envie o formulário com HTML/emoji/texto gigante — deve ser rejeitado ou exibido como texto.

## Reportar vulnerabilidade
Abra um [Security Advisory](https://github.com/Kawasanchezz/Site-T-nis-/security/advisories/new) privado.
