# Contexto para agentes

Dois pacotes independentes, sem workspace na raiz. O guia do repositório é `README.md`. Não há regras em `.cursor/`. `fe/README.md` é o texto padrão do Vite.

- `fe/`: React 18, TypeScript e Vite. Pacote npm `nlw-ia`. Scripts: `dev`, `build`, `lint`, `preview`. `vite.config.ts` não define porta (Vite usa 5173). O cliente em `src/lib/axios.ts` aponta para `http://localhost:3333`.
- `upload-ai-api/`: Fastify na porta 3333 (`src/server.ts`). Único script: `dev` (`tsx watch src/server.ts`). PostgreSQL via Prisma (`DATABASE_URL`). OpenAI via `OPENAI_KEY` em `src/lib/openai.ts`.

Não invente rotas, scripts ou telas. O que a API expõe e o que a interface ainda deixa incompleto estão no `README.md`.
