import fastify from 'fastify';
import { fastifyCors } from "@fastify/cors";
import { getAllPromptsRoute } from "./routes/get-all-prompts";
import { uploadVideoRoute } from "./routes/upload-video";
import { createTranscriptionRoute } from "./routes/create-transcription";
import { generateAICompletionRoute } from "./routes/generate-ai-completion";
import { getAllVideosRoute } from "./routes/get-all-videos";
import { getVideoByIdRoute } from "./routes/get-video-by-id";
import path from "node:path";

const app = fastify();

app.register(fastifyCors, {
  origin: '*',
});

app.register(require('@fastify/static'), {
  root: path.join(__dirname, '../tmp'),
  prefix: '/tmp/',
});

app.register(getAllPromptsRoute);
app.register(getAllVideosRoute);
app.register(getVideoByIdRoute);
app.register(uploadVideoRoute);
app.register(createTranscriptionRoute);
app.register(generateAICompletionRoute);

app.listen({
  port: 3333,
}).then(() => console.log('Server started at port 3333!'));
