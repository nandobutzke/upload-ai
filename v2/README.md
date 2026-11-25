# Infraestrutura Serverless

Upload do MP4 direto no S3, transcrição com o Amazon Transcribe e geração de título e descrição com o Amazon Nova Lite. Não há banco de dados: o JSON da transcrição fica no bucket e todos os objetos expiram depois de 1 dia.

## Credenciais

As credenciais AWS já precisam estar configuradas nesta máquina, por variável de ambiente ou pelo perfil padrão da AWS CLI. O Serverless Framework usa essa cadeia no deploy. A região do serviço é `us-east-1`.

## Acesso ao modelo no Bedrock

`POST /generations` chama `us.amazon.nova-lite-v1:0`. Se o Bedrock recusar o modelo, habilite o Amazon Nova Lite em **us-east-1** no console do Amazon Bedrock, em Model access, e rode a geração de novo.

## Deploy

Na pasta `infra/`:

```bash
npm install
npx serverless deploy
```

## URL da API

O deploy imprime os endpoints da HTTP API. A origem não leva o nome do stage no caminho:

```text
https://<apiId>.execute-api.us-east-1.amazonaws.com
```

Use essa origem como `API` no teste. As rotas são `POST /uploads`, `GET /transcriptions/{id}` e `POST /generations`. O upload do MP4 dispara `startTranscription` pelo evento `s3:ObjectCreated` em `uploads/*.mp4`.

## Teste com curl

Troque a origem pela URL que o deploy imprimiu e aponte `video.mp4` para um arquivo local.

```bash
API="https://xxxxxxxx.execute-api.us-east-1.amazonaws.com"

UPLOAD=$(curl -s -X POST "$API/uploads")
ID=$(node -pe "JSON.parse(process.argv[1]).id" "$UPLOAD")
URL=$(node -pe "JSON.parse(process.argv[1]).url" "$UPLOAD")

curl -s -X PUT -H "Content-Type: video/mp4" --upload-file video.mp4 "$URL"

while true; do
  RESULT=$(curl -s "$API/transcriptions/$ID")
  echo "$RESULT"
  printf '%s' "$RESULT" | grep -q '"status":"completed"' && break
  printf '%s' "$RESULT" | grep -q '"status":"failed"' && exit 1
  sleep 15
done

curl -s -X POST "$API/generations" \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"$ID\"}"
```

`POST /uploads` responde `{ id, url, expiresIn }`. A URL vale 15 minutos. O `PUT` tem que enviar `Content-Type: video/mp4`, porque esse header entra na assinatura. A transcrição pode levar alguns minutos. Quando o status chega em `completed`, o último `curl` devolve `{ title, description }`.

## Remoção

```bash
npx serverless remove
```

O CloudFormation só apaga o bucket vazio. Os objetos expiram em 1 dia. Para remover a stack antes disso, esvazie o bucket e execute o comando outra vez.
