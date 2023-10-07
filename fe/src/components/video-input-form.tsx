import { FileVideo, Upload } from "lucide-react";
import { Separator } from './ui/separator';
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Dialog, DialogTrigger } from "./ui/dialog";
import { VideoSelectorModal } from "./video-selector-modal";
import useUploadFile from "@/hooks/useUploadFile";

export default function VideoInputForm() {
  const { previewUrl, handleUploadVideo, status, statusMessages, promptInputRef } = useUploadFile();

  return (
    <form onSubmit={handleUploadVideo} className="space-y-6">
      <Dialog>
        <DialogTrigger asChild>
          <label className="relative w-full border flex rounded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/5">
            <FileVideo className="w-4 h-4" />
            Selecione um vídeo
          </label>



        </DialogTrigger>
        <VideoSelectorModal>
          Faça upload de um vídeo ou selecione um vídeo adicionado anteriormente.
        </VideoSelectorModal>
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
