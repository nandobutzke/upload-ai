const {
  TranscribeClient,
  StartTranscriptionJobCommand,
} = require('@aws-sdk/client-transcribe');

const transcribe = new TranscribeClient({});

const decodeS3Key = (key) => decodeURIComponent(key.replace(/\+/g, ' '));

const handler = async (event) => {
  const records = event.Records || [];

  for (const record of records) {
    const bucket = record.s3.bucket.name;
    const key = decodeS3Key(record.s3.object.key);
    const match = key.match(/^uploads\/([0-9a-fA-F-]{36})\.mp4$/);

    if (!match) {
      console.log('Ignoring object outside uploads/{id}.mp4', key);
      continue;
    }

    const id = match[1];

    try {
      await transcribe.send(
        new StartTranscriptionJobCommand({
          TranscriptionJobName: id,
          LanguageCode: 'pt-BR',
          MediaFormat: 'mp4',
          Media: {
            MediaFileUri: `s3://${bucket}/${key}`,
          },
          OutputBucketName: bucket,
          OutputKey: `transcripts/${id}.json`,
        }),
      );
    } catch (error) {
      if (error.name === 'ConflictException') {
        console.log('Transcription job already exists', id);
        continue;
      }

      throw error;
    }
  }
};

module.exports = { handler };
