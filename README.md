# Geladinha Delivery — Painel (preview de frontend)

Preview de frontend para o backend NestJS **backend-geladinha-delivery**,
gerado a partir dos 16 `*.controller.ts` do projeto e dos DTOs de
criação/resposta de cada módulo.

## Stack

- **React 18** + **Vite 5** (dev server rápido, build otimizado)
- **TypeScript** em modo `strict`
- **React Router v6** para as rotas (`react-router-dom`)
- **TanStack React Query v5** — cache das requisições HTTP (`staleTime`/`gcTime`
  configurados em `src/lib/queryClient.ts`)
- **React Hook Form + Zod** — todos os formulários de criação são validados
  por schemas Zod que espelham os DTOs do backend (`src/schemas/*.ts`)
- **Context API** (`src/context/AuthContext.tsx`) — sessão/autenticação
  global, sem prop-drilling

## Estrutura de pastas

```
src/
  api/          # 1 arquivo por recurso — chamadas HTTP reais (pacote único de API)
  schemas/      # 1 arquivo por recurso — validação Zod espelhando os DTOs
  hooks/        # 1 arquivo por recurso — hooks do React Query (list/detail/create/update/delete)
  components/
    ui/         # Button, Input, Select, Card etc.
    resource/   # DynamicForm (form dirigido por schema Zod) e DataTable genéricos
    layout/     # Sidebar, Topbar, AppLayout
  context/      # AuthContext (sessão global)
  pages/        # 1 arquivo por recurso — junta lista + formulário de criação
  lib/
    apiClient.ts    # cliente HTTP único; toda chamada passa por aqui
    queryClient.ts  # instância do React Query (cache)
```

Cada chamada de API usa como base a variável de ambiente
`VITE_API_BASE_URL` — trocar de ambiente (local/homolog/produção) é só
trocar essa variável, nenhum arquivo de código precisa mudar.

Os nomes de rota usados nas chamadas (`/user`, `/motoboy`, `/work-time-place`
etc.) estão centralizados em `src/api/endpoints.ts`, extraídos literalmente
dos `@Controller(...)` e dos decorators de rota (`@Get`, `@Post`, `@Patch`,
`@Delete`) de cada `*.controller.ts` do backend. Esses mesmos nomes também
servem de `queryKey` para o React Query.

## Cobertura de recursos

Cobertura por controller do backend (16 no total). "Editar" e "Excluir" batem
exatamente nas rotas `PATCH`/`DELETE` que cada controller realmente expõe —
quando um controller não tem uma dessas rotas, a coluna fica marcada como "—"
de propósito (não é uma lacuna do frontend).

| Recurso | Listar | Criar | Editar | Excluir | Observação |
|---|---|---|---|---|---|
| Usuário | ✅ | ✅ | ✅ | ✅ | |
| Motoboy | ✅ | ✅ (moto nova **ou** existente, com toggle) | ✅ (moto/diária) | — | sem rota de exclusão própria no backend |
| Motocicleta | ✅ | ✅ | ✅ | ✅ | |
| Estabelecimento (Place) | ✅ | ✅ | ✅ | ✅ | endereço/horário só na criação |
| Horário de Serviço (admin) | ✅ | — | ✅ | ✅ | criação só via Estabelecimento/Usuário |
| Horário do Estabelecimento | ✅ | ✅ | ✅ | ✅ | dropdown de estabelecimento |
| Horário do Usuário | — | ✅ (2 ações, só WorkTime) | — | — | ações diretas, sem listagem própria |
| Horário de Intervalo | ✅ | ✅ (para mim ou para um usuário) | ✅ | ✅ | criação usa rotas de `/work-time-user`, mas a tela vive aqui |
| Cliente | ✅ | ✅ | ✅ | ✅ | + gerenciar endereços (add/remove) |
| Endereço | ✅ | — | ✅ | ✅ | criado junto de Cliente/Estabelecimento |
| Entrega (Delivery) | ✅ | ✅ | ✅ | ✅ | dropdown de motoboy/cliente + remover gorjeta |
| Vale/Compra (Voucher) | ✅ | ✅ (para mim **ou** para um motoboy) | ✅ | ✅ | dropdown de motoboy |
| Pagamento de Motoboy (Payout) | ✅ | ✅ (via pré-visualização) | fechar/reabrir + 🔄 atualizar | ✅ | `GET /payout/preview` em tempo real antes de criar |
| Caixa de Televendas (Settlement) | ✅ | ✅ (via pré-visualização) | fechar/reabrir + 🔄 atualizar | ✅ | `GET /settlement/preview` em tempo real antes de criar |
| Tip | — | — | — | ✅ | botão de remover gorjeta na tela de Entregas |

Todo campo que referencia outra entidade por UUID (motoboy, cliente,
estabelecimento, usuário, horário de serviço) é um **dropdown** que lista as
entidades cadastradas e extrai o ID sozinho — em nenhum formulário é preciso
digitar um UUID à mão.

Todo formulário de edição segue a mesma regra: **qualquer campo pode ficar em
branco** que o Zod converte para `null` antes de enviar (nunca `""`), e o
backend trata isso como "não alterar este campo" — não existe mais a
obrigatoriedade de preencher tudo de novo só para editar um campo.

Campos `placeCode` (User, Motocicleta, Motoboy, Entrega, Payout, Settlement)
também são dropdowns — o backend usa o **CNPJ do estabelecimento** como
identificador nesse campo (confirmado pelo `ParsePlaceCodePipe`, que formata
e valida o valor como CPF/CNPJ), então o dropdown extrai `place.cnpj`, não o
`id` nem o `code`.

### Payout e Settlement: pré-visualização em tempo real

Esses dois módulos têm um fluxo diferente dos demais, espelhando o método
`preview` que é o carro-chefe de ambos os controllers:

1. Escolha o motoboy/operador (pelo `nickname`) e o período (`from`/`to`) e
   clique em **Visualizar** — isso chama `GET /payout/preview` (ou
   `/settlement/preview`), que recalcula tudo **em tempo real** a partir de
   entregas, vouchers e gorjetas do banco, sem salvar nada ainda.
2. O card de pré-visualização mostra o resultado de forma limpa (entregas,
   diária/gorjetas ou dinheiro/cartão/pix, vales do período, total).
3. Escolhido o estabelecimento (Settlement também pede o valor inicial do
   caixa), o botão **Confirmar** dispara a criação de verdade (`POST`), que
   internamente roda o mesmo `preview` no backend.
4. Cada pagamento/caixa já criado tem um botão **🔄 Atualizar** na tabela —
   ele dispara o `PATCH` do recurso com um novo `to` (o momento atual),
   recalculando o registro com os dados mais recentes do banco.

## Pré-requisitos

- Node.js 18 ou superior
- O backend `backend-geladinha-delivery` rodando localmente (por padrão em
  `http://localhost:3001`, conforme `src/main.ts` do backend)

## Setup

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie o arquivo de ambiente e ajuste se necessário:

   ```bash
   cp .env.example .env
   ```

   O padrão já aponta para `http://localhost:3001` (porta padrão do backend
   quando a variável `PORT` não está definida).

3. **Libere o CORS no backend** para a origem do Vite (`http://localhost:5173`).
   O `main.ts` do backend usa uma whitelist de origens — adicione
   `http://localhost:5173` a ela (ou a variável de ambiente equivalente que o
   backend usa para isso) antes de rodar o frontend, senão as requisições
   serão bloqueadas pelo navegador.

4. Suba o backend (`npm run start:dev` no projeto do backend, ou como você
   já costuma rodar).

5. Suba o frontend:

   ```bash
   npm run dev
   ```

   A aplicação abre em `http://localhost:5173`.

6. Faça login com um usuário já existente no banco do backend (e-mail,
   apelido ou telefone + senha). Esta tela consome `POST /auth/login`.

## Scripts disponíveis

- `npm run dev` — servidor de desenvolvimento (hot reload)
- `npm run build` — checagem de tipos (`tsc -b`) + build de produção (`dist/`)
- `npm run preview` — serve o build de produção localmente
- `npm run lint` — ESLint

## Notas de arquitetura

### Todo `<select>` do sistema virou `EntitySelectButton` — sheet no mobile, drawer da direita no desktop

O que antes era só um comportamento mobile do `DynamicForm` virou o padrão
**único e universal** de seleção do sistema inteiro, em qualquer tamanho de
tela:

- **`EntityPickerSheet`** (`src/components/ui/EntityPickerSheet.tsx`) ganhou
  classes CSS dedicadas (`.picker-backdrop`/`.picker-panel`, em
  `index.css`) — abaixo de 769px aparece como bottom-sheet; a partir de
  769px vira um **drawer que desliza da direita**, cobrindo a lateral
  direita da tela com o fundo escurecido. A troca entre os dois é só CSS
  (`@media (min-width: 769px)`), o componente React é o mesmo dos dois
  lados do breakpoint — nenhuma lógica de JS decide isso. Essas classes são
  propositalmente separadas de `.dialog`/`.dialog-backdrop` (usadas pelo
  `ConfirmDialog`), que devem continuar sempre centralizados — não viram
  drawer em tela grande.
- **`EntitySelectButton`** (`src/components/ui/EntitySelectButton.tsx`) — um
  botão no estilo `.input` que controla seu próprio estado de
  aberto/fechado e abre o `EntityPickerSheet`. Não depende de
  react-hook-form nem de nenhum formulário — funciona tanto solto numa
  página (`useState` local) quanto dentro do `DynamicForm` (via
  `Controller`).
- **`DynamicForm`** foi simplificado: antes só usava esse padrão no mobile
  (`useIsMobile()` decidia entre `<select>` nativo e o sheet); agora **todo**
  `FieldConfig` do tipo `select` — entidade ou enum, em qualquer tela — usa
  `EntitySelectButton` sempre. Menos ramificação, mais consistente.
- O componente `Select.tsx` (o `<select>` nativo estilizado) foi **removido**
  — depois de converter os 14 usos que ainda existiam fora do
  `DynamicForm` (painel de filtros de Entregas, seletores de usuário/moto/
  estabelecimento em WorkTimeUser, WorkTimePlace, IntervalTime, Motoboys,
  Payouts e Settlements), nenhum arquivo do projeto o importava mais.

### iPhones com notch/Dynamic Island cortando conteúdo — `viewport-fit=cover` + `dvh`

Em iPhones recentes, o topbar/drawer/login do modo mobile apareciam com o
título cortado, sobrepondo a barra de status. Causa raiz, em duas partes:

1. **`env(safe-area-inset-*)` sempre valia zero.** Esse valor só é
   calculado pelo navegador quando a meta viewport tem `viewport-fit=cover`
   — sem ela (era o caso), *toda* referência a `env(safe-area-inset-top)`/
   `env(safe-area-inset-bottom)` no CSS silenciosamente virava `0px`, então
   até a proteção que a barra inferior de abas já tinha nunca funcionou de
   verdade. Adicionado em `index.html`.
2. **`100vh` é instável no Safari mobile.** A barra de endereço do Safari
   aparece/recolhe conforme o scroll, mudando a altura *real* da viewport a
   cada momento — `100vh` não acompanha isso (fica calculado num instante
   específico), causando o shell mobile ficar com altura errada em certas
   situações. Trocado por `100dvh` (dynamic viewport height, acompanha a
   altura visível de verdade a cada instante), com `100vh` como fallback
   pra navegador sem suporte — ver classe `.mobile-shell` em `index.css`,
   usada por `AppLayout.tsx` no lugar do `minHeight: '100vh'` inline (que
   não tinha como declarar esse fallback em cascata).

Com isso: `.mobile-topbar`, `.mobile-drawer` e `.mobile-login` ganharam
`padding-top`/`padding-bottom` somando `env(safe-area-inset-top/bottom)` ao
espaçamento que já tinham, então o conteúdo deles nunca fica embaixo do
notch, da Dynamic Island ou da barra de gestos inferior — em qualquer
iPhone, não só num modelo específico.

### Erros de ação sempre visíveis, diálogos de verdade em vez de `window.confirm`

Duas correções sistêmicas aplicadas em **todas as 12 páginas** que têm ações
rápidas (excluir, alternar um campo):

- **`useActionError()`** (`src/hooks/useActionError.ts`) — antes, handlers
  como "excluir" usavam `try { await x() } finally {...}` **sem `catch`**:
  uma falha do backend virava rejeição de promise não tratada (só aparecia
  no console, nunca na tela). Esse hook centraliza a captura do erro e
  cada página renderiza `{actionError && <ErrorMessage .../>}` perto da
  lista/tabela.
- **`useConfirmDialog()`** (`src/hooks/useConfirmDialog.tsx`) — substitui
  `window.confirm()` (sem estilo, trava a UI) pelo `ConfirmDialog`
  compartilhado. `ask(mensagem, onConfirm)` abre o diálogo; renderize
  `{dialog}` uma vez na página.

### `EntityPickerSheet` integrado no `DynamicForm`, não por página

Em vez de trocar campo por campo em cada tela, o `DynamicForm` (usado por
praticamente todo formulário do sistema) decide sozinho, via `useIsMobile()`:
no mobile, todo `FieldConfig` do tipo `select` vira um botão que abre um
`EntityPickerSheet` (bottom-sheet); no desktop continua sendo o `<select>`
nativo. A leitura/escrita do valor usa `Controller` do react-hook-form (não
`register`), porque o campo não tem um `<input>` nativo por trás no modo
mobile. Isso significa que **qualquer** tela nova que use `DynamicForm` com
um campo `select` já ganha o comportamento certo em ambos os tamanhos de
tela, de graça.

### Dashboard: carrossel no mobile, grid no desktop

Os 3 cards "Ranking de motoboys", "Caixas em aberto" e "Adiantamentos
recentes" tinham um bug de overflow real: o grid `1.3fr 1fr` não tinha
fallback nenhum abaixo de 768px, e os itens do grid não tinham `min-width:0`
(causa clássica de estouro em CSS Grid quando o conteúdo interno é mais
largo que a coluna). Cada card virou um componente à parte
(`RankingCard`/`OpenSettlementsCard`/`RecentVouchersCard`) reaproveitado nos
dois layouts:
- **Desktop**: grid `1.3fr 1fr` (Ranking + Caixas) + card cheio abaixo
  (Adiantamentos), com `min-width:0` e truncamento de texto por segurança.
- **Mobile** (`useIsMobile()`): os 3 viram slides de um carrossel horizontal
  com scroll-snap e uma barra de progresso (`DashboardCarousel`), sem
  precisar de biblioteca externa.

### Linhas de tabela no mobile agora são cards de verdade

`.table-wrapper tr` (o modo "stack" abaixo de 768px) só tinha
`border-bottom` — sem `margin-bottom`, as linhas empilhadas ficavam coladas
umas nas outras. Agora cada linha tem borda completa, raio, sombra e
`margin-bottom: 12px`, com o `.table-wrapper` externo perdendo seu próprio
fundo/sombra no mobile (já que virou só um contêiner de layout, não mais um
cartão único). Corrige de graça **toda** tabela do sistema no mobile —
Caixas, Pagamentos, Horários, Endereços etc.

### Duas armadilhas do backend que já causaram bug real — documentadas aqui pra não se repetir

- **`PATCH /motorcycle/:id` não existe.** O `MotorcycleController` só tem
  `POST`/`GET`/`DELETE`. Editar uma moto isolada (tela de Motocicletas) usa
  `PATCH /motoboy/motorcycle/restrict/:id` (`deliveryManApi.updateRestrictMotorcycle`),
  que vive no controller de Motoboy, não no de Motorcycle.
- **Permissão de Delivery não tem bypass de admin.**
  `delivery.service.ts#findOneOwnedBy` só permite editar/excluir a quem
  criou a entrega (operador) ou ao motoboy designado — nem admin foge
  disso. `DeliveriesPage` só mostra os botões quando `canManage()` é `true`.
- **`ResponseIntervalTimeDto` não traz o usuário dono do intervalo** — só
  o `workTime` associado, e `workTime.users` lista todo mundo que
  compartilha aquele horário. `IntervalTimePage` mostra nome/telefone
  quando dá pra inferir com segurança (horário não compartilhado, exatamente
  1 usuário); do contrário mostra "Compartilhado (N usuários)". Uma solução
  100% confiável precisa adicionar `user` no DTO de resposta do backend.


### App shell mobile de verdade (< 768px), não só CSS

A partir de um handoff dedicado (design mobile do Deck da Praia, aplicado
com a paleta terracota/sage já usada no resto do app — **mesma marca em
tudo**, cores não vieram do handoff), o app ganhou um shell mobile
genuinamente diferente do desktop abaixo de 768px, não só uma versão
"espremida" do mesmo layout:

- **`useIsMobile()`** (`src/hooks/useIsMobile.ts`) — hook com
  `window.matchMedia('(max-width: 768px)')`, mesmo breakpoint das media
  queries do CSS (JS e CSS nunca discordam sobre o que é "mobile").
  `AppLayout.tsx` usa esse hook para escolher entre dois shells inteiros:
  Sidebar+Topbar (desktop, como já era) ou `MobileTopBar` +
  `MobileDrawer` + `MobileBottomTabs` (novo).
- **Bottom tabs** (`MobileBottomTabs.tsx`) — 4 atalhos fixos (Início,
  Entregas, Caixas/Pagamentos — o rótulo e o destino trocam conforme o
  papel do usuário —, Horários).
- **Drawer mobile com gating por papel** (`MobileDrawer.tsx`) — usa
  `navConfig.ts` (a mesma fonte da Sidebar desktop), que ganhou um campo
  `minRole` opcional e uma função `canSeeNavLink()`. **Só o drawer mobile
  aplica esse gating** — a Sidebar desktop continua mostrando tudo sem
  restrição, como sempre mostrou; não mudei o comportamento existente do
  desktop. Item sem permissão aparece desabilitado com a tag "em breve".
- **Login com variante mobile** (`LoginPage.tsx`) — abaixo de 768px, tela
  escura em tela cheia com os círculos decorativos e um switch de papel
  (Televendas/Motoboy/Admin). Esse switch é **só visual** — o backend não
  recebe "papel escolhido" no login (o JWT já carrega o papel real do
  usuário resolvido); não afeta o que é enviado no submit.

### Dois componentes novos, reutilizáveis (ainda não conectados em nenhuma tela)

- **`ConfirmDialog`** (`src/components/ui/ConfirmDialog.tsx`) — diálogo de
  confirmação (título + mensagem + Cancelar/Excluir), pra substituir
  `window.confirm()` nos fluxos mobile.
- **`EntityPickerSheet`** (`src/components/ui/EntityPickerSheet.tsx`) —
  bottom-sheet genérico pra escolher uma entidade (Cliente, Motoboy,
  Estabelecimento) em vez de um `<select>` nativo — recebe uma lista de
  `{value, label, meta, selected}` e um `onSelect`. O ícone de check fica
  sempre montado (opacidade 0/1 conforme `selected`) em vez de
  condicionalmente renderizado — o handoff relatou um crash de re-render
  nesse padrão no protótipo original.

**Ainda pendente** (próxima fase): conectar esses dois componentes nas
telas de Entregas/Clientes/Motoboys/Caixas-Pagamentos, e os chips de
status/filtro específicos que o handoff mobile descreve pra cada uma. Por
enquanto essas páginas continuam com o tratamento responsivo que já
existia (grid de cards + tabela em "stack"), que já funciona em mobile,
só não segue ainda o padrão exato do novo handoff.

### Tema visual e layout responsivo (design system "Organic")

O app inteiro (desktop e mobile) usa o design system **"Organic"** —
cream/terracota/sage, tipografia Caprasimo (títulos) + Figtree (corpo),
formas em pílula, sombras suaves. Diferente das passadas anteriores, desta
vez o tema não é só um conjunto de variáveis: `src/index.css` importa as
classes de componente reais do handoff (`.btn`, `.card`, `.input`, `.tag`,
`.table`), e os componentes em `src/components/ui/` (Button, Card, Input,
Select, Checkbox, IconButton, Badge, ErrorMessage) renderizam essas classes
em vez de estilo inline — a mesma API de props de antes, implementação por
dentro trocada. Isso trouxe de graça estados que não existiam (`:hover`,
`:focus-visible`), já que são regras CSS de verdade, não `style={{}}`.

Pontos importantes:

- Os nomes de variável em `:root` seguem **exatamente** os do handoff
  (`design_handoff_geladinha_admin_organic/styles.css`) — `--color-accent`,
  `--color-accent-2`, os ramps `100`–`900` de neutro/accent/accent-2,
  `--font-heading`/`--font-body`, `--radius-sm/md/lg`, `--shadow-sm/md/lg`.
  Isso substitui o conjunto improvisado de passadas anteriores
  (`--color-primary`, `--color-chrome` etc.) — qualquer atualização futura
  do design pode ser colada direto em `:root` sem remapear nome nenhum.
- `--color-danger`/`--color-success` não vêm do handoff (o protótipo não
  tem estado de erro) — escolhidos à mão pra combinar com a paleta.
- Dois **aliases de compatibilidade** ficaram em `:root`, documentados
  como tal: `--color-border` (→ `--color-divider`) e `--radius`
  (→ `--radius-md`) — cobrem páginas que ainda não foram totalmente
  portadas para as novas classes. Remova o alias conforme for atualizando
  cada arquivo.
- `Sidebar`/`Topbar` usam `lucide-react` (nova dependência) para os ícones
  de navegação — `src/components/layout/navConfig.ts` é a fonte única dos
  15 itens de menu (agrupados em 5 seções, como no handoff) e também
  alimenta o `Topbar`, que descobre o título da tela atual comparando a
  rota ativa contra essa mesma lista.
- O `Topbar` mostra avatar/nome/cargo do usuário **de verdade**, vindos de
  `useMe()` — não é decorativo. A tag "API conectada" e o campo de busca,
  por outro lado, são só visuais por enquanto (o handoff não especifica
  comportamento de busca real).
- As fontes (Caprasimo/Figtree) vêm do Google Fonts via `@import` no topo
  de `index.css` — **precisa ser a primeira regra do arquivo**, antes até
  do `:root`; um `@import` em qualquer outra posição é silenciosamente
  ignorado pelo navegador (é regra do CSS, não bug do Vite) e as fontes não
  carregam.
- Ainda não portados para o design final: o conteúdo específico de cada
  tela de listagem (linha de endpoints em `<code>`, tags de status por
  página, ex.: `tag-accent-2` para "ativo"/"pago") — Dashboard e Login já
  foram portados nesta rodada.

Abaixo de **768px**, o layout muda de apresentação sem duplicar nenhuma
tela nem componente:

- **Sidebar → menu sanduíche**: em telas largas, `.sidebar` é uma coluna
  fixa normal. Abaixo do breakpoint, vira um drawer (`position: fixed` +
  `transform: translateX(...)`), acionado pelo botão hamburger do
  `Topbar` (que existe sempre no DOM mas fica com `visibility: hidden` em
  telas largas, só pra não deslocar o resto do topbar). O estado de
  aberto/fechado mora em `AppLayout.tsx` e é passado como prop simples
  para `Sidebar`/`Topbar` — sem Context novo, sem biblioteca de UI.
- **Tabelas → cards empilhados**: `DataTable.tsx` só ganhou um atributo
  (`data-label` em cada `<td>`, com o texto do cabeçalho da coluna). Todo o
  resto é CSS: abaixo de 768px, o `<table>` vira blocos (`display: block`
  em table/tr/td), o `<thead>` é escondido visualmente, e cada `<td>` usa
  `content: attr(data-label)` num `::before` para mostrar o rótulo da
  coluna ao lado do valor. Isso funciona pra **qualquer** tabela do
  sistema automaticamente — nenhuma página precisou de ajuste.

Nada disso depende de JavaScript de detecção de tela — é só CSS reagindo
ao tamanho da viewport, então funciona também ao redimensionar a janela
(sem precisar recarregar a página).

### Dashboard e Login: dado real, não decorativo

O Dashboard (`DashboardPage.tsx`) não usa nenhum valor fixo — todo KPI é
calculado a partir dos hooks que já existem:
- **Entregas hoje / Faturamento hoje** (+ variação vs. ontem): filtra
  `useDeliveries()` por `createdAt` do dia atual e do dia anterior.
- **Motoboys ativos**: conta `useDeliveryMen()` cuja `motorcycle.isActive`
  é `true`, sobre o total cadastrado.
- **Caixas pendentes** (card em destaque): conta `useSettlements()` com
  `isClosed === false`.
- **Ranking de motoboys**: agrega `useDeliveries()` por `motoboy.user.id`
  no próprio cliente (contagem de entregas + soma de `totalPurchase`) —
  não existe endpoint de ranking no backend, então isso é derivado aqui.
- **Vales recentes**: os 5 últimos de `useVouchers()`, ordenados por
  `createdAt`.

A tela de Login (`LoginPage.tsx`) ganhou o layout de 2 colunas do handoff
(painel escuro com os círculos animados + formulário) — o grid vive na
classe `.login-grid` (não inline), justamente para a media query mobile
poder virar 1 coluna só e esconder o painel de marca
(`.login-brand-panel`) em telas estreitas.

### ⚠️ `forceLogout`: por que editar um usuário às vezes pede login de novo

O backend tem um comportamento de segurança que vale a pena conhecer: em
`PATCH /user/:id`, sempre que o corpo da requisição chega com **qualquer** um
destes campos preenchido — `nickname`, `phone`, `secondPhone`, `email` ou
`placeCode` — o backend seta `user.forceLogout = true` naquele usuário
(mesmo que o valor enviado seja **idêntico** ao que já estava salvo). A
partir daí, **toda** requisição futura com o token daquele usuário passa a
retornar `401 - Você precisa fazer login` (checado em `jwt.strategy.ts`),
até que ele faça login de novo (o `login()` reseta a flag).

Por isso, o formulário de edição de usuário (`UsersPage.tsx`) só envia esses
5 campos quando o valor **realmente muda** em relação ao que veio da busca —
caso contrário manda `null` (que o backend já entende como "não alterar").
Assim, editar só o nome de alguém não derruba a sessão dele à toa. Se você
*de fato* mudar um desses campos (inclusive do seu próprio usuário logado),
o backend vai exigir login de novo mesmo — isso é esperado, não é bug.

Se o app começar a devolver esse erro em algum lugar sem motivo aparente,
o `apiClient` (`src/lib/apiClient.ts`) já trata isso: ao detectar
especificamente essa mensagem, ele limpa o token salvo e redireciona para
`/login` sozinho, em vez de deixar a tela travada com um erro genérico.

- **Cache HTTP**: cada hook de recurso (`useUsers`, `useMotorcycles` etc.)
  usa o React Query com `staleTime` de 30s e `gcTime` de 5min — dados são
  reaproveitados entre navegações sem refetch desnecessário, e toda mutação
  (`useCreateX`) invalida automaticamente o cache da lista correspondente.
- **Formulários dinâmicos**: `src/components/resource/DynamicForm.tsx` recebe
  um schema Zod + uma lista de `FieldConfig` (label, tipo de campo, grupo) e
  monta o formulário — inclusive para campos aninhados como
  `user.name`/`motorcycle.licensePlate` no formulário de Motoboy. O tipo de
  campo `time` renderiza um seletor de horário nativo (`<input
  type="time">`) e converte o valor para ISO8601 (ou `null`, se vazio) na
  hora do envio — ver `src/lib/timeUtils.ts`.
- **Campos de edição sempre opcionais**: `src/schemas/common.ts` exporta
  `toUpdateSchema(createSchema)`, que gera o schema de update envolvendo
  cada campo do schema de criação (recursivamente, inclusive objetos
  aninhados) na regra "vazio vira `null`". Isso espelha o
  `PartialType(CreateXDto)` do backend — todo formulário de edição aceita
  deixar qualquer campo em branco sem disparar erro de validação.
- **Seleção de entidades por dropdown**: campos que no backend esperam um
  UUID de outra entidade (motoboy, cliente, estabelecimento, usuário,
  horário) são resolvidos com um `<select>` alimentado por um hook de
  listagem já existente (`useDeliveryMen`, `useCustomers`, `usePlaces` etc.)
  — o usuário escolhe pelo nome/apelido, o componente extrai o `id`.
- **Autenticação**: o token JWT retornado por `/auth/login` fica guardado
  num **cookie** do navegador (`geladinha_access_token`, `src/lib/authStorage.ts`),
  com validade sincronizada com o `exp` do próprio token. Não existe cópia
  do token em memória em lugar nenhum — o `apiClient` lê o cookie **na hora**
  de cada requisição (`Authorization: Bearer <token>`), de propósito, para
  não haver risco de uma cópia desatualizada em algum estado do React ficar
  fora de sincronia com o valor real. Não há renovação automática de token
  neste preview: quando expira, a próxima chamada retorna 401 e o app
  redireciona para `/login` sozinho.

Dúvidas ou problemas ao rodar? É só chamar.
