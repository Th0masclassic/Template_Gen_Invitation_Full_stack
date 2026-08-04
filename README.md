# InviteLab Wedding & Baby Shower Invitation Portal

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
- domínio numa conta Cloudflare gratuita e Cloudflare Tunnel para publicar o portal

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

## Etsy, recibos e códigos de acesso

Uma compra Etsy é aberta com o **número do recibo Etsy**, sem depender de
`buyer_email` e sem mostrar um código de seis dígitos ao comprador. Em
`/etsy`, o servidor confirma o recibo pago diretamente na API Etsy; depois da
confirmação, pede o email onde serão enviados o comprovativo e os links finais.
O número do recibo continua a ser a credencial privada do gerador e do RSVP
Admin. O gestor local e os códigos de seis dígitos continuam disponíveis para
vendas diretas, Stripe, testes e apoio ao cliente.

Abrir o gestor local:

```text
http://127.0.0.1:3000/operator/access-codes
```

Também é possível gerar e gerir códigos pelo terminal, dentro da pasta do
projeto:

```bash
npm run token:create -- --label "Venda direta #1234" --pack full --event wedding
npm run token:create -- --count 5 --label "Lote de lançamento" --pack normal --event wedding
npm run token:list
npm run token:revoke -- 123456
```

Os códigos ficam guardados localmente em:

```text
generated/access-codes.json
```

Regras do fluxo:

1. O cliente abre `/wedding` ou `/babyshower` e introduz o código.
2. Um código novo abre o formulário de criação.
3. Quando o primeiro pedido é aceite, o código fica ligado atomicamente ao
   respetivo `requestId` e não pode criar outro projeto.
4. Se o cliente introduzir novamente o mesmo código, em qualquer browser, é
   redirecionado para `/results/{requestId}` para continuar o projeto existente.
5. O botão para refazer o projeto abre `/wedding?redo={requestId}` e mantém o
   mesmo código, pack e tipo de evento.
6. Para uma compra nova, escolhe **Usar outro código** na página de resultados.
   O portal abre `/wedding?new=1`, aceita o novo código e mantém o pedido
   anterior intacto. Para voltar ao pedido antigo, introduz novamente o código
   antigo.
7. Atualizações, aprovações, regenerações e a finalização continuam dentro do
   mesmo pedido; não consomem outro código.

Configuração:

```dotenv
ACCESS_CODE_REQUIRED=1
ACCESS_CODE_STORE_PATH=generated/access-codes.json
ACCESS_CODE_SESSION_SECRET=COLOCA_UM_SEGREDO_LONGO_E_ALEATORIO
```

Para ativar a entrega automática Etsy, preencher as credenciais reais e mapear
cada `listing_id` para um produto (`invite_only_pack`, `digital_pdf_pack` ou
`Full_pack`) e um método de criação (`template`, `custom_import` ou `both`)
(Wedding Full):

```dotenv
ETSY_INTEGRATION_ENABLED=1
ETSY_SHOP_ID=12345678
ETSY_API_KEYSTRING=...
ETSY_API_SHARED_SECRET=...
ETSY_WEBHOOK_SIGNING_SECRET=whsec_...
ETSY_OAUTH_ACCESS_TOKEN=
ETSY_OAUTH_REFRESH_TOKEN=...
ETSY_OAUTH_EXPIRES_AT=
ETSY_LISTING_PACK_MAP={"1234567890":{"packType":"invite_only_pack","creationMode":"template"},"2345678901":{"packType":"digital_pdf_pack","creationMode":"both"},"3456789012":{"packType":"Full_pack","creationMode":"both"}}

RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=InviteLab <orders@invitelab.art>
RESEND_REPLY_TO_EMAIL=support@invitelab.art
CUSTOMER_SUPPORT_EMAIL=support@invitelab.art
CUSTOMER_PORTAL_URL=https://invitelab.art/wedding
```

Registar na Etsy o endpoint público
`POST /api/integrations/etsy/webhooks` para os eventos `order.paid` e
`order.canceled`. O servidor valida a assinatura no corpo bruto, confirma o
recibo pago pela API Etsy, aplica o mapa de listings e trata repetições sem
duplicar direitos de acesso. O webhook não exige o email do comprador. O email
é recolhido apenas depois de o comprador validar o recibo em `/etsy`, e o envio
da confirmação usa uma chave idempotente para não duplicar mensagens. Tokens
OAuth atualizados são guardados em `generated/etsy/oauth-token.json`; esta
pasta nunca deve ser publicada.

Cada pack deve ter um `listing_id` Etsy próprio; a integração não distingue
variações dentro do mesmo listing. O mapa automático atual cria produtos de
casamento. Listings de baby shower devem ficar fora do mapa até existir uma
entrada de produto específica. Ativar um listing Full sem as credenciais R2
faz o servidor recusar a inicialização da entrega Etsy, para não vender um
website que não possa ser publicado. Recibos pagos sem nenhum listing mapeado
são ignorados e geram um aviso no log do servidor.

Quando `ACCESS_CODE_SESSION_SECRET` fica vazio, o servidor cria um segredo
persistente em `generated/.access-session-secret`. Em produção é preferível
definir explicitamente um valor longo no `.env`. Nunca publicar o ficheiro de
códigos, o segredo da sessão ou a pasta `generated/`.

Nunca colocar chaves em `public/`, em URLs, nem no código enviado ao browser.

## Fluxo do cliente

1. O cliente introduz o código de 6 dígitos recebido por email ou criado pelo
   atelier. Um código já utilizado abre o pedido existente em
   `/results/{requestId}`.
2. O idioma é escolhido por `?lang=`, preferência guardada, país do proxy ou
   `Accept-Language`.
3. O tipo de evento é definido pela rota: `/wedding` ou `/babyshower`.
4. O código bloqueia o pack e o tipo de evento comprados. O cliente escolhe um
   template e os dados base. No Full Pack apenas indica nesta primeira etapa se
   pretende incluir o website; a história e as fotografias são pedidas mais
   tarde.
5. O servidor cria o pedido e abre `/results/{requestId}` enquanto a OpenAI
   gera o convite e edita o envelope de referência para colocar as iniciais do
   casal no selo. As duas imagens só são reveladas quando ambas terminam.
6. O cliente aprova o conjunto ou escolhe, num modal, refazer apenas o convite
   ou apenas o envelope. Cada imagem tem um limite independente de cinco
   versões durante 24 horas.
7. Depois da aprovação, o worker do servidor envia a PNG para uma conversa
   nova no ChatGPT e invoca `@Canva Image To Design`.
8. O serviço Canva guarda o URL do editor e cria o Template Link. A etapa final
   do Full Pack só fica disponível quando esse link estiver pronto.
9. Na finalização, o cliente escolhe entre manter ou substituir tanto o convite
   como o envelope aprovado com uma PNG/JPG/WebP final.
10. Quando o website foi selecionado, a mesma página pede a história, horários,
   local, RSVP, alojamento, viagem, FAQ e cinco fotografias com funções
   específicas no layout.
11. Antes de renderizar, GPT-5.6 Luna melhora os textos narrativos do website
    com saída JSON estruturada. Nomes, datas, horas, localizações, URLs e outros
    dados factuais continuam controlados pelo servidor.
12. O servidor usa as imagens finais para criar o PDF e o website responsivo.
    O PDF abre no envelope fechado; clicar no selo leva à página 2 com o
    convite. A paleta visual do PDF e do website é derivada do envelope final.
13. O website é publicado automaticamente no Cloudflare R2. Assim que o URL
    `invites.invitelab.art` fica disponível, esse URL é carregado no `iframe` da
    página de resultados. Em ecrãs pequenos, a página desloca-se uma vez até à
    pré-visualização. Não existe botão de publicação para o cliente.

O estado, o PDF, o Canva Template Link e os URLs do website ficam guardados. O
cliente pode fechar a página e regressar ao mesmo `/results/{requestId}`.

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

## RSVP do Full Pack e integração com Youform

O RSVP é incluído automaticamente no **Full Pack**. O formulário de criação do
cliente já não mostra qualquer opção de RSVP ou link Youform. Quando
`YOUFORM_DEFAULT_FORM_URL` está configurado, o formulário Youform é aberto
dentro do modal RSVP existente e recebe automaticamente os campos ocultos
`request_id`, `language` e `couple`.

Se Youform não estiver configurado, o website usa o formulário nativo como
fallback e envia para `POST /api/public/rsvp/{requestId}`.

As respostas são guardadas por projeto em:

```text
generated/rsvp/{requestId}/
```

O email é normalizado para minúsculas e usado como chave única dentro do
casamento. Uma segunda submissão com o mesmo email recebe sucesso, mas não cria
outra entrada nem aumenta a contagem.

### RSVP Admin do cliente

O comprador recebe o link do projeto por email. No Full Pack, esse mesmo link
inclui o painel **RSVP Admin**. Projetos Etsy usam o mesmo número do recibo que
abriu o gerador; vendas Stripe e diretas continuam protegidas pelo código de
seis dígitos associado ao projeto. O painel permite:

- ver total, presentes e não presentes;
- consultar nome, email, contacto, resposta e mensagem;
- atualizar a lista;
- descarregar CSV.

Endpoints protegidos pelo mesmo cookie assinado do código do projeto:

```text
GET /api/customer/jobs/{requestId}/rsvp
GET /api/customer/jobs/{requestId}/rsvp.csv
```

Os convidados só têm acesso ao endpoint público de submissão. Nunca recebem um
endpoint para ler as respostas.

### Youform e webhook

O formulário Youform embebido envia cada resposta para o sistema através do
webhook v2. O campo oculto `request_id` garante que a resposta é guardada apenas
na pasta e no RSVP Admin do casamento que abriu o formulário.

Configurar:

```dotenv
YOUFORM_DEFAULT_FORM_URL=https://app.youform.com/forms/SEU_FORM_ID
YOUFORM_WEBHOOK_SECRET=SEGREDO_DO_WEBHOOK
```

Na Youform, adicionar os campos ocultos `request_id`, `language` e `couple`, e
configurar em **Integrations → Webhook**:

```text
https://SEU-DOMINIO/api/integrations/youform/webhook
```

Usar o mesmo signing secret HMAC-SHA256 em ambos os lados. O webhook ignora
eventos repetidos e também não regista uma segunda resposta com o mesmo email
no mesmo projeto. Sem `YOUFORM_WEBHOOK_SECRET`, o endpoint responde 503 e a
integração Youform não funciona; o RSVP nativo continua independente.

## Website do evento e hosting partilhado

A estrutura HTML continua determinística e segura. GPT-5.6 Luna atua apenas
como editor de copy antes do renderer inserir os dados no template responsivo
integrado a partir de `wedding-website-responsive-all-devices.zip`:

- `wedding-site.mjs` insere e escapa os dados do cliente;
- `website-template/styles.css` contém o design responsivo;
- `website-template/script.js` controla envelope, menu, countdown, animações,
  FAQ e RSVP;
- `website-template/assets/` contém as versões responsivas do envelope.

Depois da finalização do Full Pack é criado:

```text
generated/sites/{requestId}/
  index.html
  styles.css
  script.js
  assets/
    envelope-480.webp
    envelope-720.webp
    envelope-941.webp
  envelope.png          # envelope final escolhido/gerado
  invitation.png
  site-photo-01.jpg   # capa
  site-photo-02.jpg   # história 1
  site-photo-03.jpg   # história 2
  site-photo-04.jpg   # local
  site-photo-05.jpg   # alojamento/região
  site-manifest.json
  wedding.ics
```

A imagem exportada do Canva, quando enviada, substitui a imagem gerada tanto no
PDF como na secção do convite do website. O envelope final é normalizado,
copiado como `envelope.png` e torna-se a fonte visual e cromática dos dois
artefactos. As cinco fotografias adicionais são independentes e têm posições
explícitas, evitando depender da ordem de upload. Quando um campo ou uma
fotografia opcional não existe, o renderer usa texto ou imagem de fallback sem
quebrar o layout.

O website de casamento inclui:

- abertura com envelope e hero em ecrã inteiro;
- convite, countdown e história do casal;
- duas fotografias de história;
- RSVP, local, mapa e calendário/ICS;
- timeline completa, dress code e presente;
- alojamento, viagem, estacionamento e FAQ;
- layout adaptado a computador, tablet e telemóvel.

O renderer anterior continua ativo para baby shower, para não alterar esse
produto. A preparação usa uma diretoria temporária e uma substituição atómica;
apenas os ficheiros registados no manifesto podem ser servidos como fotografias.

A pré-visualização local está disponível em:

```text
/site/{requestId}/
```

Para melhorar os textos do website com GPT, configurar:

```dotenv
OPENAI_WEBSITE_COPY_MODEL=gpt-5.6-luna
OPENAI_WEBSITE_COPY_TIMEOUT_MS=45000
```

Se esta chamada falhar temporariamente, o website continua com os textos
originais enviados pelo cliente.

Para publicar os websites estáticos no Cloudflare R2, configurar:

```dotenv
R2_ACCOUNT_ID=SEU_ACCOUNT_ID
R2_ACCESS_KEY_ID=SUA_ACCESS_KEY
R2_SECRET_ACCESS_KEY=SEU_SECRET
R2_BUCKET_NAME=invitelab-invites-sites
R2_PUBLIC_BASE_URL=https://invites.invitelab.art
MAX_CONCURRENT_SITE_PUBLISHES=2
SITE_PUBLISH_MAX_ATTEMPTS=3
SITE_PUBLISH_RETRY_DELAY_MS=5000
```

Todos os convites são enviados para um único bucket sob
`/sites/{requestId}/`. A publicação é automática logo após a geração dos
artefactos. O computador do operador faz o upload e o tráfego público é servido
pelo Cloudflare. Falhas transitórias são repetidas automaticamente até ao limite configurado. O endpoint manual permanece apenas para recuperação operacional
e compatibilidade com versões anteriores.

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
GET  /etsy
POST /api/customer/etsy-receipt
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
- Nomes de ficheiro e links públicos são gerados pelo servidor.
- A chave OpenAI e os secrets nunca chegam ao browser.
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
e publicação no domínio partilhado.

## PDF interativo com GPT Vision

O PDF final usa diretamente as imagens aprovadas do envelope e do convite. Não
existe geração LaTeX nem uma página RSVP criada pelo servidor. A API GPT Vision
analisa apenas a imagem aprovada e devolve regiões para ações que já estejam
visíveis no design: localização, calendário e RSVP. O servidor adiciona links
invisíveis nessas regiões; quando um ícone ou texto de ação não existe, nenhum
link é criado.

- Localização abre o Google Maps verificado.
- Calendário descarrega o ficheiro `.ics`.
- RSVP abre o website publicado quando esse website existe.

## Post-approval responsive website workflow

The Full Pack website is configured after the invitation is approved and the Canva template link is ready. The customer can keep the generated invitation or upload the final Canva export, complete the story/venue/timeline/travel questionnaire, and assign five photographs to exact website sections. GPT-5.6 Luna improves the submitted copy, the server renders the fixed responsive template, and Cloudflare R2 publication starts automatically. The results iframe loads the final public InviteLab URL; there is no customer-facing publish button.

See [`WEBSITE_FLOW_UPDATE.md`](./WEBSITE_FLOW_UPDATE.md) for the complete flow and the files to edit.
