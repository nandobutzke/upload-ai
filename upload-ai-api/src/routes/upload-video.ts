import { FastifyInstance, FastifyRequest } from "fastify";
import { prisma } from "../lib/prisma";
import fastifyMultipart from '@fastify/multipart';
import path from 'node:path';
import fsPromises from 'node:fs/promises';
import fs from 'node:fs';
import { pipeline } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';

const pump = promisify(pipeline);

export async function uploadVideoRoute(app: FastifyInstance) {
  app.register(fastifyMultipart, {
    limits: {
      fileSize: 1_048_576 * 25
    }
  })

  app.post('/videos', async (request, reply) => {
    const audioData = await request.file();
    const frameImageData = await request.file();

    console.log({ audioData, frameImageData })

    if (!audioData) {
      return reply.status(400).send({ error: 'Missing audio file input.' });
    }

    if (!frameImageData) {
      return reply.status(400).send({ error: 'Missing frame image data input.' });
    }

    const extension = path.extname(audioData.filename);

    if (extension !== '.mp3') {
      return reply.status(400).send({ error: 'Invalid audio file type, please upload an MP3.' });
    }

    const randomUUIDGenerated = randomUUID();

    const fileBaseName = path.basename(audioData.filename, extension);
    const fileUploadName = `${fileBaseName}-${randomUUIDGenerated}${extension}`;
    const uploadDestination = path.resolve(__dirname, '../../tmp', fileUploadName);

    await pump(audioData.file, fs.createWriteStream(uploadDestination));

    const video = await prisma.video.create({
      data: {
        name: audioData.filename,
        path: uploadDestination,
      },
    });

    const frameImageExtension = '.jpg'; // Change to the appropriate image file extension
    const frameImageFileName = `${randomUUIDGenerated}-frame${frameImageExtension}`;
    const frameImageDestination = path.resolve(__dirname, '../../tmp', frameImageFileName);

    await pump(frameImageData.file, fs.createWriteStream(frameImageDestination));

    const thumbnail = await prisma.thumbnail.create({
      data: {
        videoId: video.id,
        frameImagePath: frameImageDestination,
      },
    });

    return reply.status(200).send({ video, thumbnail });
  });
}
