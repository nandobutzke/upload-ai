import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import fastifyMultipart from '@fastify/multipart';
import path from 'node:path';
import fs from 'node:fs';
import { pipeline } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';

const pump = promisify(pipeline);

export async function uploadVideoRoute(app: FastifyInstance) {
  app.register(fastifyMultipart, {
    limits: {
      fileSize: 1_048_576 * 25,
    }
  })

  app.post('/videos', async (request, reply) => {
    const data = await request.file();

    const audio = data?.fields.audio;

    console.log({ audio });

    if (!audio) {
      return reply.status(400).send({ error: 'Missing audio file input.' });
    }

    const extension = path.extname(audio.filename);

    if (extension !== '.mp3') {
      return reply.status(400).send({ error: 'Invalid audio file type, please upload an MP3.' });
    }

    const randomUUIDGenerated = randomUUID();

    const fileBaseName = path.basename(audio.filename, extension);
    const fileUploadName = `${fileBaseName}-${randomUUIDGenerated}${extension}`;
    const uploadDestination = path.resolve(__dirname, '../../tmp', fileUploadName);

    await pump(audio.file, fs.createWriteStream(uploadDestination));

    const video = await prisma.video.create({
      data: {
        name: audio.filename,
        path: uploadDestination,
      },
    });

    console.log({ data })

    const frameImageFile = data?.fields.frameImageFile;

    if (!frameImageFile) {
      return reply.status(400).send({ error: 'Missing frame image data input.' });
    }

    const frameImageExtension = '.jpg'; // Change to the appropriate image file extension
    const frameImageFileName = `${randomUUIDGenerated}-frame${frameImageExtension}`;
    const frameImageDestination = path.resolve(__dirname, '../../tmp', frameImageFileName);

    await pump(frameImageFile.file, fs.createWriteStream(frameImageDestination));

    const thumbnail = await prisma.thumbnail.create({
      data: {
        videoId: video.id,
        frameImagePath: frameImageDestination,
      },
    });

    return reply.status(200).send({ video, thumbnail });
  });
}
