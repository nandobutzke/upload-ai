import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../shadcn/ui/Dialog";

import { FileVideo } from "lucide-react";
import { VideoCarousel } from "../VideoCarousel";
import useUploadFile from "@/hooks/useUploadFile";
import { Separator } from '../shadcn/ui/Separator';
import { Button } from "../shadcn/ui/Button";

export function VideoSelectorModal() {
  const { previewUrl, imagePreviewFromDatabase, handleSelectedFile } = useUploadFile();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <label className="relative w-full border flex rounded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/5">
          {previewUrl || imagePreviewFromDatabase ? (
            imagePreviewFromDatabase === '' ? (
              <video src={previewUrl} controls={false} className="pointer-events-none absolute inset-0 w-full h-full object-cover" />
            ) : (
              <img src={`http://localhost:3333/tmp/${imagePreviewFromDatabase}`} alt="Thumbnail do vídeo" className="pointer-events-none absolute inset-0 w-full h-full object-cover" />
            )
          ) : (
            <>
              <FileVideo className="w-4 h-4" />
              Selecione um vídeo
            </>
          )}
        </label>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] sm:max-h-[750px]">
        <DialogHeader>
          <DialogTitle>Selecione um Vídeo</DialogTitle>
          <DialogDescription className="flex flex-col gap-2">
            Faça upload de um vídeo ou selecione um vídeo adicionado anteriormente.
          </DialogDescription>
        </DialogHeader>
        {imagePreviewFromDatabase !== ''
          ? (
            <img src={`http://localhost:3333/tmp/${imagePreviewFromDatabase}`} className="h-full w-full object-fill aspect-video" alt="Thumbnail do vídeo" />
          )
          : (
            <>
              <label htmlFor="video" className="relative w-full h-full border flex aspect-video rounded-md cursor-pointer border-dashed text-lg flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/5">
                {previewUrl
                  ? (
                    <video src={previewUrl} controls={false} className="pointer-events-none absolute inset-0 w-full h-full object-fill" />
                  )
                  : (
                    <>
                      <FileVideo className="w-4 h-4" />
                      Selecione um vídeo
                    </>
                  )}
              </label>

              <input type="file" id="video" accept="video/mp4" className="sr-only" onChange={handleSelectedFile} />
            </>
          )}

        <Separator />

        <VideoCarousel />
        <DialogFooter className="self-end">
          <DialogClose asChild>
            <Button>Salvar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
