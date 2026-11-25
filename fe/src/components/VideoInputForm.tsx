import { Upload } from "lucide-react";
import { Separator } from './shadcn/ui/Separator';
import { Label } from "./shadcn/ui/Label";
import { Button } from "./shadcn/ui/Button";

import useUploadFile from "@/hooks/useUploadFile";
import { VideoSelectorModal } from "./VideoSelectorModal";

export default function VideoInputForm() {
  const {
    handleUploadVideo,
    status,
    statusLabel,
    errorMessage,
    selectedFileName,
    canUpload,
  } = useUploadFile();

  return (
    <form onSubmit={handleUploadVideo} className="space-y-6">
      <VideoSelectorModal />

      <Separator />

      <div className="space-y-2">
        <Label>Arquivo</Label>
        <p className="text-sm text-muted-foreground break-all">
          {selectedFileName || 'Nenhum MP4 selecionado'}
        </p>
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <p className="text-sm text-muted-foreground">{statusLabel}</p>
        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={!canUpload}
        data-success={status === 'completed'}
        className="w-full data-[success=true]:bg-emerald-400"
      >
        {status === 'waiting' || status === 'failed' ? 'Enviar MP4' : statusLabel}
        <Upload className="w-4 h-4 ml-2" />
      </Button>
    </form>
  );
}
