const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const {
  BedrockRuntimeClient,
  InvokeModelCommand,
} = require('@aws-sdk/client-bedrock-runtime');
const { json, readJsonBody } = require('./http');

const s3 = new S3Client({});
const bedrock = new BedrockRuntimeClient({});

const PROMPT_PREFIX =
  'Você é um editor de vídeo. Com base na transcrição abaixo, escreva um título curto e uma descrição em português. Responda apenas com um JSON válido no formato {"title":"...","description":"..."}, sem markdown e sem texto extra.\n\nTranscrição:\n';

const readBody = async (body) => {
  if (typeof body === 'string') {
    return body;
  }

  return body.transformToString();
};

const transcriptText = (payload) =>
  payload?.results?.transcripts?.[0]?.transcript ?? '';

const parseModelJson = (text) => {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');

    if (start === -1 || end <= start) {
      throw error;
    }

    return JSON.parse(trimmed.slice(start, end + 1));
  }
};

const handler = async (event) => {
  let body;

  try {
    body = readJsonBody(event);
  } catch (error) {
    return json(400, { message: 'O corpo da requisição precisa ser JSON.' });
  }

  const id = body.id;

  if (!id || typeof id !== 'string') {
    return json(400, { message: 'Informe o id da transcrição.' });
  }

  let payload;

  try {
    const object = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: `transcripts/${id}.json`,
      }),
    );
    payload = JSON.parse(await readBody(object.Body));
  } catch (error) {
    if (error.name === 'NoSuchKey' || error.name === 'NotFound') {
      return json(409, { message: 'A transcrição ainda não está disponível.' });
    }

    throw error;
  }

  const response = await bedrock.send(
    new InvokeModelCommand({
      modelId: process.env.MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [
              {
                text: `${PROMPT_PREFIX}${transcriptText(payload)}`,
              },
            ],
          },
        ],
        inferenceConfig: {
          maxTokens: 1024,
        },
      }),
    }),
  );

  const modelPayload = JSON.parse(new TextDecoder().decode(response.body));
  const modelText = (modelPayload.output?.message?.content || [])
    .map((part) => part.text || '')
    .join('');
  const copy = parseModelJson(modelText);

  return json(200, {
    title: typeof copy.title === 'string' ? copy.title : '',
    description: typeof copy.description === 'string' ? copy.description : '',
  });
};

module.exports = { handler };
