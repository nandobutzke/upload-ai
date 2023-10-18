import { Upload } from "lucide-react";
import { Separator } from './shadcn/ui/Separator';
import { Label } from "./shadcn/ui/Label";
import { Textarea } from "./shadcn/ui/Textarea";
import { Button } from "./shadcn/ui/Button";

import useUploadFile from "@/hooks/useUploadFile";
import { VideoSelectorModal } from "./VideoSelectorModal";

export default function VideoInputForm() {
  const { handleUploadVideo, handleTranscriptionPromptChange, status, transcriptionPrompt, statusMessages, promptInputRef } = useUploadFile();

  return (
    <form onSubmit={handleUploadVideo} className="space-y-6">
      <VideoSelectorModal />

      <Separator />

      <div className="space-y-2">
        <Label
          htmlFor="transcription_prompt"
        >
          Prompt de transcrição
        </Label>

        <Textarea
          id="transcription_prompt"
          ref={promptInputRef}
          value={transcriptionPrompt ?? ''}
          onChange={handleTranscriptionPromptChange}
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
