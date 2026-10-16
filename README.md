# upload.ai

Aplicação para enviar um vídeo, transcrevê-lo e gerar texto com a API da OpenAI. A interface se apresenta como **upload.ai** e o pacote do frontend se chama `nlw-ia`. O título da página é `NLW IA`. O cabeçalho diz que foi desenvolvido no NLW da Rocketseat (o texto na tela está escrito `NWL`).

Não há `package.json` na raiz. São dois projetos independentes, cada um com o próprio `yarn.lock`:

| Diretório | O que é |
| --- | --- |
| `fe/` | Interface em React. |
| `upload-ai-api/` | API HTTP em Fastify. |

`fe/README.md` é o texto que o Vite gera no scaffold. Este arquivo é o guia do repositório.

## Arquitetura atual

```text
navegador (fe)
  │  ffmpeg.wasm converte o MP4 em MP3 e extrai um frame JPEG
  │  axios → http://localhost:3333
  ▼
Fastify (upload-ai-api, porta 3333)
  │  grava arquivos em upload-ai-api/tmp
  │  Prisma → PostgreSQL (DATABASE_URL)
  │  OpenAI (OPENAI_KEY): Whisper e GPT-3.5-turbo
  ▼
resposta JSON, ou stream de texto em /ai/complete
```

A interface é uma única tela (`fe/src/app.tsx`). Não há roteador. O estado do vídeo escolhido fica em React (`videoId`). O cliente HTTP está fixo em `fe/src/lib/axios.ts` (`baseURL: http://localhost:3333`).

A API sobe em `upload-ai-api/src/server.ts`. CORS aceita qualquer origem (`origin: '*'`). Arquivos de `upload-ai-api/tmp` são servidos em `/tmp/` por `@fastify/static`. A pasta `tmp` está no `.gitignore` da API.

### Banco

O schema Prisma (`upload-ai-api/prisma/schema.prisma`) usa **PostgreSQL** e a variável `DATABASE_URL`. O `migration_lock.toml` também declara `postgresql`.

Modelos atuais:

| Modelo | Tabela | Campos |
| --- | --- | --- |
| `Video` | `video` | `id` (UUID), `name`, `path`, `prompt` opcional, `transcription` opcional, `createdAt`. Relação com thumbnails. |
| `Prompt` | `prompt` | `id` (UUID), `title`, `template`. Sem relação com `Video`. |
| `Thumbnail` | `thumbnail` | `id` (UUID), `frameImagePath`, `videoId` único. |

O `prompt` gravado no vídeo é o texto livre enviado na transcrição. Os templates da tabela `prompt` são outra coisa: a interface só os lista e copia o template para a área de texto.

Há um arquivo `upload-ai-api/prisma/dev.db` (SQLite) no repositório. O schema **não** aponta para ele.

### Variáveis de ambiente

Não existe `.env` nem `.env.example`. A API ignora `.env` no Git.

| Variável | Onde é lida |
| --- | --- |
| `DATABASE_URL` | `prisma/schema.prisma` |
| `OPENAI_KEY` | `src/lib/openai.ts` (`new OpenAI({ apiKey })`) |

`src/lib/openai.ts` importa `dotenv/config`, então um `.env` na pasta `upload-ai-api` é carregado quando esse módulo entra no processo. As rotas de transcrição e de completion importam esse módulo, e o servidor registra essas rotas na subida.

Exemplo do que o código espera, não um arquivo commitado:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/upload_ai"
OPENAI_KEY="sk-..."
```

O nome do banco e o usuário não estão definidos em lugar nenhum do repositório.

## Como executar e desenvolver

Os dois lados usam Yarn (há `yarn.lock` em cada pasta). O `upload-ai-api/yarn-error.log` commitado foi gerado com Yarn 1.22.19 e Node 18.16.0 no Windows. O repositório não fixa versão de Node nem de Yarn em `engines`.

PostgreSQL precisa estar acessível pela `DATABASE_URL` antes da API atender rotas que usam o Prisma. A OpenAI precisa de `OPENAI_KEY` para transcrever e para gerar texto.

### API

Na pasta `upload-ai-api`:

```bash
yarn
```

O único script do `package.json` é:

```bash
yarn dev
```

Isso executa `tsx watch src/server.ts`. Não há script de build, start de produção nem teste. Não há `tsconfig.json` na API: o `tsx` executa o TypeScript direto. Ao subir, o processo imprime `Server started at port 3333!`.

O Prisma está em `devDependencies`, e o seed está declarado assim:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

Com as dependências instaladas, o CLI do Prisma aplica o que já está no repositório:

```bash
yarn prisma migrate dev
yarn prisma db seed
```

`migrate dev` usa as pastas em `prisma/migrations` (setembro e outubro de 2023). `db seed` apaga todos os registros de `prompt` e cria três templates: **Título YouTube**, **Descrição YouTube** e **Captions Youtube**. Cada template contém o marcador `{transcription}`.

### Frontend

Na pasta `fe`:

```bash
yarn
yarn dev
```

`vite.config.ts` não define `server.port`, então o Vite usa a porta padrão **5173**. Outros scripts do `package.json`:

| Script | Comando |
| --- | --- |
| `yarn build` | `tsc && vite build` |
| `yarn lint` | `eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0` |
| `yarn preview` | `vite preview` |

O alias `@` aponta para `fe/src` (`tsconfig.json` e `vite.config.ts`). O ESLint em `fe/.eslintrc.json` estende `airbnb`, `plugin:react/recommended` e `plugin:react-hooks/recommended`. Os dois projetos têm `.editorconfig` com indentação de 2 espaços e fim de linha CRLF.

Suba a API antes da interface. Sem ela, a lista de prompts, o carrossel e o envio falham nas chamadas para `localhost:3333`.

### Fluxo na interface

1. O modal (`VideoSelectorModal`) pede um arquivo `video/mp4`, ou um item do carrossel de vídeos já enviados.
2. Um MP4 novo vira pré-visualização local (`URL.createObjectURL`). O botão **Carregar vídeo** só segue se houver arquivo novo.
3. No navegador, `@ffmpeg/ffmpeg` (`fe/src/lib/ffmpeg.ts`, com os binários em `fe/src/ffmpeg/`) faz duas execuções:
   - gera `output.mp3` com `libmp3lame` e bitrate de áudio `20k`;
   - extrai `frame.jpg` no instante `00:00:02` (`-vframes 1`).
4. O hook envia `FormData` para `POST /videos` com os campos de arquivo `audio` e `frameImageFile`.
5. Em seguida chama `POST /videos/:videoId/transcription` com `{ prompt }` lido do campo **Prompt de transcrição**.
6. O `videoId` devolvido fica no estado de `App`.
7. **Prompt** carrega `GET /prompts` e, ao escolher um item, cola o `template` na área de texto da esquerda.
8. **Executar** usa `useCompletion` de `ai/react` contra `POST /ai/complete`, com o texto dessa área, o `videoId` e a temperatura do slider (0 a 1, passo 0,1, valor inicial 0,5). O resultado aparece na área somente leitura.

Os rótulos do botão de upload, em `fe/src/hooks/useUploadFile.tsx`, são: `converting` → `Convertendo...`, `uploading` → `Transcrevendo...`, `generating` → `Carregando...`, `success` → `Sucesso!`. No código, `uploading` é o `POST /videos` e `generating` é a transcrição.

Escolher um vídeo do carrossel chama `GET /videos/:id`, preenche o prompt de transcrição, mostra a thumbnail e marca o status como `success`, sem converter de novo e sem chamar a rota de transcrição. A completion depois usa a transcrição que já estiver no banco.

### Contrato da API

| Método e caminho | O que faz |
| --- | --- |
| `GET /prompts` | Lista todos os prompts. |
| `GET /videos` | Lista vídeos com `thumbnail.frameImagePath`. Devolve também os campos do vídeo, inclusive `path` e `transcription`. |
| `GET /videos/:videoId` | `videoId` precisa ser UUID. Devolve `id`, `prompt` e `thumbnail.frameImagePath`, ou `null` se não existir. |
| `POST /videos` | Multipart. Limite de 25 MiB (`1_048_576 * 25`). Exige o arquivo `audio` com extensão `.mp3` (comparação exata, minúscula) e o arquivo `frameImageFile`. Grava os dois em `tmp` e cria `Video` e `Thumbnail`. Resposta 200: `{ video, thumbnail }`. |
| `POST /videos/:videoId/transcription` | JSON `{ prompt: string }`. Lê o arquivo em `video.path` e chama o Whisper (`whisper-1`, `language: 'pt'`, `temperature: 0`). Grava `transcription` e `prompt` no vídeo e devolve `{ transcription }`. |
| `POST /ai/complete` | JSON `{ videoId: uuid, prompt: string, temperature: number }` (`temperature` entre 0 e 1, padrão 0,5). Troca `{transcription}` no prompt pelo texto salvo. Se ainda não houver transcrição, responde 400 `{ error: 'Video transcription was not generated yet.' }`. Caso contrário, faz stream do `gpt-3.5-turbo` com o pacote `ai` (`OpenAIStream` + `streamToResponse`). |

`upload-ai-api/routes.http` é um arquivo de cliente HTTP (`# @name`, separador `###`) apontando para `localhost:3333`. Ele **não** acompanha o código atual:

- o exemplo de upload manda o campo `file` com `./audio.mp3`; a rota exige `audio` e `frameImageFile`;
- o exemplo de completion manda `template`; a rota exige `prompt`.

Os UUIDs desse arquivo são exemplos fixos. `upload-ai-api/audio.mp3` é o arquivo citado por esse exemplo.

## Diretórios principais

```text
fe/
  index.html                 título NLW IA
  package.json               nome nlw-ia; scripts dev, build, lint, preview
  vite.config.ts             plugin React, alias @, ffmpeg fora de optimizeDeps
  tailwind.config.js         Tailwind com o wrapper do Material Tailwind
  components.json            shadcn/ui, estilo new-york, base zinc
  public/vite.svg
  src/main.tsx               monta App dentro de CustomThemeProvider
  src/app.tsx                a única tela
  src/index.css              tema escuro nas variáveis CSS de :root
  src/components/
    VideoInputForm.tsx       prompt de transcrição e botão de carregar
    VideoSelectorModal/      modal de arquivo ou vídeo já enviado
    VideoCarousel/           carrossel dos vídeos de GET /videos
    PromptSelect.tsx         select de GET /prompts
    shadcn/ui/               Button, Dialog, Label, Select, Separator, Slider, Textarea
  src/hooks/useUploadFile.tsx
  src/lib/axios.ts
  src/lib/ffmpeg.ts
  src/lib/utils.ts           cn() com clsx e tailwind-merge
  src/ffmpeg/                ffmpeg-core.js, ffmpeg-core.wasm, ffmpeg-worker.js
  src/providers/custom-theme-provider/
  src/types/Video.ts
  src/assets/img/teste.jpg

upload-ai-api/
  package.json               script dev; seed do Prisma
  routes.http
  audio.mp3
  yarn-error.log             log de um yarn add fastify-static-virtual que falhou (404)
  src/server.ts
  src/lib/openai.ts
  src/lib/prisma.ts
  src/routes/
    get-all-prompts.ts
    get-all-videos.ts
    get-video-by-id.ts
    upload-video.ts
    create-transcription.ts
    generate-ai-completion.ts
  prisma/schema.prisma
  prisma/seed.ts
  prisma/dev.db              SQLite presente no tree; o schema não o usa
  prisma/migrations/
```

Dependências que a interface realmente importa: React 18, Vite 4, TypeScript, Tailwind, Radix (via os componentes shadcn), `@material-tailwind/react` (carrossel), `axios`, `ai` (`useCompletion`), `@ffmpeg/ffmpeg` e `@ffmpeg/util`, `lucide-react`, `react-slick` está no `package.json` e não é importado em `src/`.

Dependências que a API realmente importa: `fastify`, `@fastify/cors`, `@fastify/multipart`, `@fastify/static`, `@prisma/client`, `openai`, `ai`, `zod`, `dotenv`. `fluent-ffmpeg` está no `package.json` e não é importado em `src/`.

A licença `MIT` está só no `package.json` da API. Não há arquivo `LICENSE`. O pacote do frontend está `"private": true`.

## O que está implementado

- Tela única com cabeçalho, prompt, resultado, upload, select de prompt, select de modelo, slider de temperatura e botão **Executar**.
- Conversão de MP4 para MP3 e extração de um frame no navegador, com ffmpeg.wasm.
- Upload do áudio e do frame, persistência do vídeo e da thumbnail, e arquivo servido em `/tmp/`.
- Transcrição em português com Whisper, gravada no vídeo.
- Três templates de prompt via seed, listados na interface.
- Geração em stream com `gpt-3.5-turbo`, temperatura configurável, e substituição de `{transcription}`.
- Reutilizar um vídeo já salvo pelo carrossel, sem reenviar o arquivo.
- Tema visual escuro (variáveis em `src/index.css`) e setas do carrossel customizadas no `ThemeProvider` do Material Tailwind.

## O que ainda não está, ou está incompleto no código

Não há autenticação, testes, CI, Docker, script de produção da API, nem CRUD de prompts além do seed e do `GET /prompts`. Não há rota para apagar vídeo.

Itens visíveis no código que não fecham o fluxo:

- O select **Modelo** está `disabled`, com um único item `GPT-3.5-turbo 16k`. O texto da tela diz que a opção poderá ser customizada em breve. A rota `/ai/complete` sempre chama o modelo `gpt-3.5-turbo`, sem o sufixo `16k`, e não recebe modelo no corpo.
- O botão **Github** do cabeçalho não tem `href` nem `onClick`.
- `routes.http` diverge dos campos reais (`file` / `template`).
- Se o MP3 é aceito e o frame não vem no formulário, a rota já gravou o arquivo de áudio e a linha em `video`, e então responde 400 `Missing frame image data input.`
- Um erro no `POST` de upload ou de transcrição só faz `console.error` no navegador. O status da tela não volta para `waiting`.
- A thumbnail é salva com caminho absoluto (`path.resolve`). O carrossel e o hook separam esse caminho com o separador do Windows (`split("\\tmp\\")`) para montar `http://localhost:3333/tmp/<arquivo>`. Esse recorte não acha o nome do arquivo num caminho POSIX (`/tmp/`).
- A primeira chamada ao ffmpeg coloca um filtro de vídeo (`-vf select=...`) **depois** do nome `output.mp3`. A extração do frame é a segunda chamada, a que gera `frame.jpg`.
- `fe/src/types/Video.ts` declara `title: string`. O model `Video` não tem coluna `title`. `GET /videos/:videoId` também não devolve `name`, `path` nem `transcription`.
- `GET /videos` inclui o caminho absoluto em disco.
- `fluent-ffmpeg` e `react-slick` estão declarados e não são usados no código de `src/`. O estático da API é `@fastify/static`. O `yarn-error.log` registra a tentativa falha de instalar `fastify-static-virtual`.
- `prisma/dev.db` não faz parte do schema atual.
