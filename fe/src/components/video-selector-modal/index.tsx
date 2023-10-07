import { ReactNode } from 'react';
import { DialogContent, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { DialogHeader, DialogFooter } from "../ui/dialog";
import { VideoCarousel } from "../carousel";

import { FileVideo } from "lucide-react";
import { Separator } from "../ui/separator";
import useUploadFile from "@/hooks/useUploadFile";

interface VideoSelectorModalProps {
  children: ReactNode;
}

export function VideoSelectorModal({ children }: VideoSelectorModalProps) {
  const { previewUrl, imagePreviewFromDatabase, handleSelectedFile } = useUploadFile();

  return (
    <DialogContent className="sm:max-w-[700px] sm:max-h-[750px]">
      <DialogHeader>
        <DialogTitle>Selecione um Vídeo</DialogTitle>
        <DialogDescription className="flex flex-col gap-2">
          {children}
        </DialogDescription>
      </DialogHeader>
      {imagePreviewFromDatabase !== ''
        ? (
          typeof previewUrl !== "undefined" && <img src={`http://localhost:3333/tmp/${imagePreviewFromDatabase}`} className="h-full w-full" alt="Thumbnail do vídeo" />
        )
        : (
          <>
            <label htmlFor="video" className="relative w-full h-full border flex aspect-video rounded-md cursor-pointer border-dashed text-lg flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/5">
              <FileVideo className="w-4 h-4" />
              Selecione um vídeo

              <video src={previewUrl} controls={false} className="pointer-events-none absolute w-full h-auto" />
            </label>

            <input type="file" id="video" accept="video/mp4" className="sr-only" onChange={handleSelectedFile} />

          </>
        )}

      <Separator />

      <VideoCarousel />
      <DialogFooter className="self-end">
        <Button>Salvar</Button>
      </DialogFooter>
    </DialogContent>
  );
}
