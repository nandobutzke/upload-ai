import { FileVideo, Upload } from "lucide-react";
import { Separator } from './ui/separator';
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { loadFFmpeg } from "@/lib/ffmpeg";
import { fetchFile } from '@ffmpeg/util';
import { api } from "@/lib/axios";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { VideoSelectorModal } from "./video-selector-modal";

type Status = 'waiting' | 'converting' | 'uploading' | 'generating' | 'success';

const statusMessages = {
  converting: 'Convertendo...',
  uploading: 'Transcrevendo...',
  generating: 'Carregando...',
  success: 'Sucesso!',
}

interface VideoInputFormProps {
  onVideoUploaded: (videoId: string) => void;
}

export default function VideoInputForm({ onVideoUploaded }: VideoInputFormProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>('waiting');

  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  async function convertVideoToAudio(video: File) {
    console.log('Convert started');

    const ffmpeg = await loadFFmpeg();

    await ffmpeg.writeFile('input.mp4', await fetchFile(video));

    ffmpeg.on('progress', progress => {
      console.log('Convert progress: ' + Math.round(progress.progress * 100));
    });

    await ffmpeg.exec([
      '-i',
      'input.mp4',
      '-b:a',
      '20k',
      '-acodec',
      'libmp3lame',
      'output.mp3'
    ]);

    const data = await ffmpeg.readFile('output.mp3');

    const audioFileBlob = new Blob([data], { type: 'audio/mpeg' });
    const audioFile = new File([audioFileBlob], 'audio.mp3', {
      type: 'audio/mpeg'
    });

    console.log('Convert finished');

    return audioFile;
  }

  function handleSelectedFile(event: ChangeEvent<HTMLInputElement>) {
    const { files } = event.currentTarget;

    if (!files) {
      return;
    }

    const selectedFile = files[0];

    setVideoFile(selectedFile);
  }

  async function handleUploadVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const prompt = promptInputRef.current?.value;

    if (!videoFile) {
      return;
    }

    setStatus('converting');

    const audioFile = await convertVideoToAudio(videoFile);

    const data = new FormData();

    data.append('file', audioFile);

    setStatus('uploading');

    const response = await api.post('/videos', data);

    const videoId = response.data.video.id;

    setStatus('generating');

    await api.post(`/videos/${videoId}/transcription`, {
      prompt
    })

    setStatus('success');

    onVideoUploaded(videoId);
  }

  const previewUrl = useMemo(() => {
    if (!videoFile) {
      return undefined;
    }

    return URL.createObjectURL(videoFile);
  }, [videoFile])

  return (
    <form onSubmit={handleUploadVideo} className="space-y-6">
      <Dialog>
        <DialogTrigger asChild>
          <button className="relative w-full border flex rounded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/5">
            <FileVideo className="w-4 h-4" />
            Selecione um vídeo
          </button>

        </DialogTrigger>
        <VideoSelectorModal previewUrl={previewUrl}>
          <Button className="flex w-auto">
            <label
              htmlFor="video"
            >
              <FileVideo className="w-4 h-4 mr-2" />
              Selecione um vídeo
            </label>
          </Button>
          <input type="file" id="video" accept="video/mp4" className="sr-only" onChange={handleSelectedFile} />
        </VideoSelectorModal>

        {/* <video src={previewUrl} controls={false} className="pointer-events-none absolute inset-0" />  */}
      </Dialog>


      <Separator />

      <div className="space-y-2">
        <Label
          htmlFor="transcription_prompt">Prompt de transcrição</Label>

        <Textarea
          id="transcription_prompt"
          ref={promptInputRef}
          disabled={status !== 'waiting'}
          className="h-20 resize-none leading-relaxed"
          placeholder="Inclua palavras-chave mencionadas no vídeo separadas por vírgula (Ex.: html, css, javascript)"
        />

      </div>

      <Button
        type="submit"
        disabled={status !== 'waiting'}
        data-success={status === 'success'}
        className="w-full data-[success=true]:bg-emerald-400"
      >
        {status === 'waiting' ? (
          <>
            Carregar vídeo
            <Upload className="w-4 h-4 ml-2" />
          </>
        ) : statusMessages[status]}
      </Button>
    </form>
  );
}
