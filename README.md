# Atelier Vow Wedding & Baby Shower Invitation Portal

Portal para criar convites de casamento e baby shower em PNG, PDF interativo,
design Canva editável por camadas e website público.

O fluxo visual gera uma imagem final com a OpenAI. Depois da aprovação, um
worker do servidor abre uma sessão persistente do ChatGPT, carrega a PNG e usa
`@Canva Image To Design` para separar texto e elementos. Depois de obter o URL
do editor, a sessão Canva autenticada cria o Template Link entregue ao cliente.
A Canva Connect API continua disponível como caminho alternativo de Brand
Template.

## Requisitos

- Node.js 22.9 ou mais recente
- projeto OpenAI com acesso aos modelos configurados
- Microsoft Edge ou Google Chrome no computador do servidor
- conta ChatGPT com a app Canva ligada
- conta Canva com acesso a Image To Design e Brand Templates
- integração Canva Developer privada apenas para publicar o Brand Template
- formulário Youform publicado para RSVP
- conta EdgeOne Pages, API Token e CLI para publicar os websites

Instalar no macOS:

```bash
brew install node cloudflared
brew install --cask microsoft-edge
npm ci
cp .env.example .env
```

No Windows, instalar Node.js 22.9+ e Microsoft Edge, e depois executar
`npm ci`. Preencher `.env` com as chaves reais e arrancar:

```bash
npm start
```

O ficheiro `.env` é carregado automaticamente e está ignorado pelo Git. As
chaves não precisam de voltar a ser definidas depois de `Ctrl+C`.

Abrir uma das rotas públicas:

```text
http://127.0.0.1:3000/wedding
http://127.0.0.1:3000/babyshower
```

`/` redireciona para `/wedding`. Mudar o tipo de evento no seletor também
atualiza o URL, sem perder o idioma escolhido.

Nunca colocar chaves em `public/`, em URLs, nem no código enviado ao browser.

## Fluxo do cliente

1. O idioma é escolhido por `?lang=`, preferência guardada, país do proxy ou
   `Accept-Language`.
2. O tipo de evento é definido pela rota: `/wedding` ou `/babyshower`. Não
   existe um segundo seletor de evento dentro do formulário.
3. O cliente escolhe um dos dez templates da coleção dessa rota. Nomes,
   descrições, formulário e conteúdo gerado seguem o idioma selecionado.
4. No Full Pack pode adicionar até seis fotografias para o website, além da
   fotografia principal opcional usada no convite. O pack apenas de template
   não envia nem conserva fotografias do website.
5. O servidor cria imediatamente um pedido persistente e devolve
   `/result/{requestId}`.
6. A OpenAI gera uma única imagem final a partir do template controlado, dos
   dados e da fotografia opcional.
7. O cliente pode aprovar ou pedir outra versão, até três tentativas durante
   24 horas.
8. Ao aprovar, a imagem fica bloqueada e o microsite do evento é preparado.
9. Com `EDGEONE_API_TOKEN` configurado, a publicação do microsite começa
   automaticamente em segundo plano.
10. O cliente decide quando clicar `Gerar PDF`.
11. O PDF é criado e a PNG aprovada entra na fila Canva do servidor.
12. Um worker serial abre uma conversa nova no ChatGPT, carrega a imagem e
    invoca `@Canva Image To Design`.
13. O worker guarda o URL do editor e o serviço autenticado cria e valida um
    Template Link; se o encurtador falhar, conserva o link longo utilizável.
14. O cliente recebe esse Template Link, que cria uma cópia editável na conta
    dele, sem abrir o ChatGPT nem executar passos manuais. A publicação oficial
    como Brand Template permanece disponível como fallback configurável.

O estado e os links ficam guardados. O cliente pode fechar a página e regressar
ao mesmo `/result/{requestId}`.

## Idiomas

Idiomas suportados:

```text
pt, en, es, fr, de
```

Ordem de deteção:

1. parâmetro `?lang=`;
2. idioma guardado no browser;
3. país enviado por Cloudflare, Vercel, CloudFront ou `X-Country-Code`;
4. cabeçalho `Accept-Language`;
5. inglês como fallback.

O idioma faz parte do projeto e é usado no prompt da imagem, nas datas, no PDF
e no website do casamento. O seletor permite sempre mudar manualmente.

## RSVP com Youform

A aplicação não cria o formulário Youform. Cria e publica um formulário na
Youform e adiciona estes campos ocultos:

```text
request_id
language
couple
```

Configurar:

```dotenv
YOUFORM_DEFAULT_FORM_URL=https://app.youform.com/forms/SEU_FORM_ID
YOUFORM_WEBHOOK_SECRET=SEGREDO_DO_WEBHOOK
```

No formulário Youform:

1. abrir `Integrations`;
2. adicionar um webhook v2 HTTPS;
3. usar
   `https://SEU-DOMINIO/api/integrations/youform/webhook`;
4. configurar o mesmo signing secret usado em
   `YOUFORM_WEBHOOK_SECRET`;
5. enviar um teste e confirmar resposta HTTP 2xx.

O microsite passa os três campos ocultos ao embed. O webhook verifica
HMAC-SHA256 sobre o corpo bruto, ignora duplicados por `event_id`, serializa
escritas concorrentes por pedido e guarda as respostas em:

```text
generated/rsvp/{requestId}/
```

O endpoint público do estado mostra apenas a contagem e a última data de
resposta, nunca os dados dos convidados.

## Website do evento e EdgeOne

Depois da aprovação é criado:

```text
generated/sites/{requestId}/
  index.html
  invitation.png
  site-photo-01.jpg
  ...
  site-photo-06.jpg
  site-manifest.json
  wedding.ics
```

O website inclui:

- abertura/revelação inspirada num convite físico;
- hero e galeria com as fotografias enviadas, com fallback para a imagem
  aprovada quando não existem fotografias adicionais;
- nomes, data, hora e local;
- história/mensagem, detalhes do evento e timeline;
- contagem decrescente;
- Google Maps;
- Google Calendar e ficheiro ICS;
- RSVP Youform embebido;
- dados de presente apenas quando existe IBAN;
- seletor dos cinco idiomas.

O casamento usa uma direção branca/ivory com apontamentos sage e dourados. O
baby shower usa uma direção branca e azul limpa. A preparação é feita numa
diretoria temporária e substituída de forma atómica; apenas os ficheiros
registados no manifesto podem ser servidos como fotografias.

Sem EdgeOne, a pré-visualização local continua disponível em:

```text
/site/{requestId}/
```

Para publicação:

```powershell
npm install -g edgeone@1.6.17
edgeone --version
```

Depois configurar:

```dotenv
EDGEONE_API_TOKEN=SEU_TOKEN
EDGEONE_CLI_PATH=
EDGEONE_PROJECT_PREFIX=atelier-vow
EDGEONE_DEPLOY_AREA=global
EDGEONE_DEPLOY_ENV=production
MAX_CONCURRENT_SITE_PUBLISHES=2
```

O servidor executa a CLI oficial num subprocesso isolado, cria um projeto de
direct upload por pedido e guarda o URL devolvido. Se a CLI não estiver no
`PATH`, `EDGEONE_CLI_PATH` pode apontar para o executável ou para o
`edgeone.js`. Publicações são enfileiradas, limitadas e recuperadas depois de
reiniciar o servidor.

## Geração, Canva e múltiplos utilizadores

Configuração principal:

```dotenv
OPENAI_API_KEY=sk-...
MAX_CONCURRENT_GENERATIONS=3
MAX_GENERATION_QUEUE=30

FAL_KEY=your-fal-key
FAL_LAYER_MODEL_ID=fal-ai/qwen-image-layered
FAL_NUM_LAYERS=8
FAL_NUM_INFERENCE_STEPS=28
FAL_GUIDANCE_SCALE=5
FAL_ACCELERATION=regular
FAL_LAYER_TIMEOUT_MS=300000
FAL_POLL_INTERVAL_MS=1500

```

Cada utilizador tem estado e ficheiros separados por UUID. Os handlers HTTP
apenas validam e enfileiram trabalho. A fila permite várias gerações em
paralelo sem misturar fotografias, prompts, camadas ou resultados.

Durante a geração, o editor e `/result/{requestId}` apresentam percentagem e as
pré-visualizações parciais disponibilizadas pelo modelo. As gerações OpenAI
podem correr em paralelo. O worker Canva usa uma fila separada com concorrência
um, porque uma única sessão visual da conta operadora não deve editar dois
designs ao mesmo tempo.

## Canva

Configuração:

```dotenv
CANVA_CHATGPT_AUTOMATION_ENABLED=1
CANVA_CHATGPT_BROWSER_EXECUTABLE=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
CANVA_CHATGPT_PROFILE_DIR=generated\canva\chatgpt-profile
CANVA_CHATGPT_HEADLESS=0
CANVA_CHATGPT_MANUAL_EDGE_CDP=1
CANVA_CHATGPT_TIMEOUT_MS=600000
CANVA_CHATGPT_MAX_ATTEMPTS=3
CANVA_CHATGPT_PUBLISH_TEMPLATE=1
CANVA_PRIVATE_TEMPLATE_LINK_ENABLED=1
CANVA_TEMPLATE_SHORTENING_ENABLED=1
CANVA_TEMPLATE_LINK_TIMEOUT_MS=30000
CANVA_TEMPLATE_LINK_MAX_ATTEMPTS=3
CANVA_MCP_ENABLED=0

CANVA_CLIENT_ID=...
CANVA_CLIENT_SECRET=...
CANVA_REDIRECT_URI=http://127.0.0.1:3000/api/canva/auth/callback
CANVA_SCOPES=design:content:write brandtemplate:meta:read brandtemplate:content:write
```

No computador do atelier, abrir:

```text
http://127.0.0.1:3000/operator/chatgpt-canva
```

Na primeira configuração, o processo tem duas fases:

1. Usar os botões “Abrir ... no Edge manual”. O servidor inicia um processo
   Microsoft Edge visível e normal, com o perfil dedicado, sem Playwright
   ligado. Resolver manualmente qualquer verificação Cloudflare e concluir os
   logins ChatGPT e Canva. O sistema não tenta resolver, automatizar ou
   contornar o desafio.
2. Só depois usar os botões “Login concluído”. Nesse momento o worker liga-se
   ao Edge já aberto através de CDP e confirma as sessões antes de retomar a
   fila. O estado “Sessão Canva autenticada” tem de aparecer antes de testar os
   links privados.

O CDP escuta apenas em `127.0.0.1` e não é publicado pelo Cloudflare Tunnel.
O perfil é exclusivo de `CANVA_CHATGPT_PROFILE_DIR`; não se deve abrir esse
perfil manualmente noutra instância do Edge. Esta rota e os endpoints de setup
só aceitam o host local e devolvem HTTP 403 através do domínio público.

As duas páginas usam o mesmo contexto persistente em
`CANVA_CHATGPT_PROFILE_DIR`. A verificação Canva observa apenas o URL e
controlos visíveis da interface; não lê nem regista cookies, passwords,
cabeçalhos de autenticação ou códigos 2FA. Um ecrã de login evidente ou uma
sessão que não possa ser confirmada interrompe o fluxo com
`CANVA_AUTH_SESSION_MISSING` antes de qualquer pedido privado de ACL.

`CANVA_CHATGPT_MANUAL_EDGE_CDP=1` é o modo recomendado quando o Edge é visível.
O modo antigo de arranque Playwright fica disponível com
`CANVA_CHATGPT_MANUAL_EDGE_CDP=0`, e é também o fallback automático para
execução headless ou quando o executável configurado não é Microsoft Edge.
Esse fallback não deve ser usado para uma primeira sessão que apresente
Cloudflare.

O browser do servidor cria o design por camadas no ChatGPT com a operação
oficial `Image To Design`. Depois de guardar o URL do editor, o serviço de
template usa a mesma sessão Canva autenticada para criar e, opcionalmente,
encurtar o link entregue ao cliente. A Canva Connect API existente continua
disponível como caminho de publicação compatível.

`CANVA_PRIVATE_TEMPLATE_LINK_ENABLED` e `CANVA_TEMPLATE_SHORTENING_ENABLED`
podem ser desligados separadamente com `0`. Os endpoints Canva `/_ajax`
utilizados pelo primeiro caminho são privados, não documentados e podem mudar
sem aviso. Nenhum cookie, cabeçalho de sessão, extensão ou token de template é
escrito nos logs. Se apenas o encurtador falhar, o cliente recebe o link longo
já validado.

Os pedidos são processados um de cada vez. Estados em curso são recuperados
depois de reiniciar o servidor, incluindo links privados pendentes criados por
ChatGPT, MCP ou importação, desde que o URL do editor já esteja guardado.
Alterações temporárias na interface do ChatGPT ativam até
`CANVA_CHATGPT_MAX_ATTEMPTS`; a PNG e o PDF continuam disponíveis mesmo quando
a integração externa falha.

## Cloudflare Tunnel

Para testar OAuth, webhook e links públicos, arrancar primeiro a aplicação e
depois o tunnel:

```bash
npm start
npm run tunnel
```

Usar o URL HTTPS `https://...trycloudflare.com` devolvido apenas em
`PUBLIC_BASE_URL`. Para a Canva Connect API, manter `CANVA_REDIRECT_URI` em
`http://127.0.0.1:3000/api/canva/auth/callback`. Reiniciar `npm start` depois
de alterar `.env`. Quick Tunnels são temporários; o URL muda quando o processo
é reiniciado.

## Endpoints principais

```text
GET  /api/client/bootstrap
GET  /wedding
GET  /babyshower
POST /api/customer/generate
GET  /api/customer/jobs/:requestId
POST /api/customer/jobs/:requestId/regenerate
POST /api/customer/jobs/:requestId/confirm
POST /api/customer/jobs/:requestId/generate-pdf
POST /api/customer/jobs/:requestId/publish-site
POST /api/integrations/youform/webhook
GET  /site/:requestId/
GET  /result/:requestId
GET  /api/customer/download/:filename
GET  /api/customer/download-pdf/:filename
GET  /api/health
```

## Segurança

- JSON e multipart têm limites explícitos.
- Apenas os dez IDs de template do servidor são aceites.
- Texto do cliente é tratado apenas como dados.
- URLs Maps e Youform são normalizados e validados.
- O webhook Youform exige assinatura HMAC válida.
- Eventos RSVP repetidos são idempotentes.
- Nomes de ficheiro e projetos EdgeOne são gerados pelo servidor.
- O API Token EdgeOne, a chave OpenAI e os secrets nunca chegam ao browser.
- O perfil autenticado do ChatGPT e o token Canva pertencem apenas à conta
  operadora e ficam fora de `public/`.
- O cliente recebe apenas o Template Link final (ou o `create_url` oficial de
  fallback) depois de Image To Design e a publicação terminarem.
- O microsite escapa todo o conteúdo do cliente e aplica CSP restritiva.

## Verificação

```bash
npm run check
npm test
npm audit
npm run test:browser:edge
/usr/bin/safaridriver --enable
npm run test:browser:safari
```

O comando `safaridriver --enable` é necessário apenas uma vez e pede
autorização do macOS. Os testes automatizados de Canva usam respostas simuladas
e nunca sessões reais. Antes de produção, executar também um pedido canário
opt-in com a conta do atelier autenticada, porque a disponibilidade dos
endpoints privados e permissões Canva é externa ao projeto.

O diagnóstico pode ser consultado em:

```text
GET /api/health
```

Mostra o modelo de imagem, estado da automação ChatGPT/Canva, filas de geração
e publicação EdgeOne.

## GPT Terra

O gerador Terra continua a usar:

```text
C:\Users\tomas\Documents\Bussiness_Convites\PDF Generator\Rules.txt
C:\Users\tomas\Documents\Bussiness_Convites\PDF Generator\interactive_wedding_pdfs_v4_pack
```

O endpoint `/api/customer/terra/latex` continua disponível e o fluxo principal
cria o PDF interativo entregue ao cliente.
