const {
  TranscribeClient,
  GetTranscriptionJobCommand,
} = require('@aws-sdk/client-transcribe');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { json } = require('./http');

const transcribe = new TranscribeClient({});
const s3 = new S3Client({});

const readBody = async (body) => {
  if (typeof body === 'string') {
    return body;
  }

  return body.transformToString();
};

const transcriptText = (payload) =>
  payload?.results?.transcripts?.[0]?.transcript ?? '';

const handler = async (event) => {
  const id = event.pathParameters?.id;

  if (!id) {
    return json(400, { message: 'Informe o id da transcrição.' });
  }

  let job;

  try {
    const result = await transcribe.send(
      new GetTranscriptionJobCommand({
        TranscriptionJobName: id,
      }),
    );
    job = result.TranscriptionJob;
  } catch (error) {
    if (
      error.name === 'NotFoundException' ||
      /not found|couldn't be found|could not be found/i.test(error.message || '')
    ) {
      return json(200, { status: 'processing' });
    }

    throw error;
  }

  const status = job?.TranscriptionJobStatus;

  if (status === 'QUEUED' || status === 'IN_PROGRESS' || !status) {
    return json(200, { status: 'processing' });
  }

  if (status === 'FAILED') {
    return json(200, { status: 'failed' });
  }

  if (status !== 'COMPLETED') {
    return json(200, { status: 'processing' });
  }

  try {
    const object = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: `transcripts/${id}.json`,
      }),
    );
    const payload = JSON.parse(await readBody(object.Body));

    return json(200, {
      status: 'completed',
      text: transcriptText(payload),
    });
  } catch (error) {
    if (error.name === 'NoSuchKey' || error.name === 'NotFound') {
      return json(200, { status: 'processing' });
    }

    throw error;
  }
};

module.exports = { handler };
