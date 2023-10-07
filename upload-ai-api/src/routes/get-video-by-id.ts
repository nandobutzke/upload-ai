import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { z } from "zod";

export async function getVideoByIdRoute(app: FastifyInstance) {
  app.get('/videos/:videoId', async (request) => {
    const paramsSchema = z.object({
      videoId: z.string().uuid(),
    })

    const { videoId } = paramsSchema.parse(request.params);

    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        Thumbnail: {
          select: {
            frameImagePath: true,
          }
        }
      }
    });

    return video;
  });
}
