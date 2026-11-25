import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../shadcn/ui/Dialog";

import { FileVideo } from "lucide-react";
import useUploadFile from "@/hooks/useUploadFile";
import { Button } from "../shadcn/ui/Button";

export function VideoSelectorModal() {
  const { previewUrl, handleSelectedFile, status } = useUploadFile();
  const isBusy = status === 'uploading' || status === 'transcribing';

  return (
    <Dialog>
      <DialogTrigger asChild>
        <label className="relative w-full border flex rounded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/5">
          {previewUrl ? (
            <video src={previewUrl} muted playsInline preload="metadata" className="pointer-events-none absolute inset-0 w-full h-full object-cover" />
          ) : (
            <>
              <FileVideo className="w-4 h-4" />
              Selecione um MP4
            </>
          )}
        </label>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Selecione um vídeo</DialogTitle>
          <DialogDescription>
            Escolha um arquivo .mp4. A prévia usa o arquivo neste computador.
          </DialogDescription>
        </DialogHeader>

        <label htmlFor="video" className="relative w-full border flex aspect-video rounded-md cursor-pointer border-dashed text-lg flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/5">
          {previewUrl ? (
            <video src={previewUrl} muted playsInline preload="metadata" className="pointer-events-none absolute inset-0 w-full h-full object-cover" />
          ) : (
            <>
              <FileVideo className="w-4 h-4" />
              Selecione um MP4
            </>
          )}
        </label>

        <input
          type="file"
          id="video"
          accept=".mp4,video/mp4"
          className="sr-only"
          onChange={handleSelectedFile}
          disabled={isBusy}
        />

        <DialogFooter className="self-end">
          <DialogClose asChild>
            <Button type="button">Usar este vídeo</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
