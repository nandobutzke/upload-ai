import { ReactNode } from 'react';
import { DialogContent, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { DialogHeader, DialogFooter } from "../ui/dialog";
import { Carousel } from "../carousel";

interface VideoSelectorModalProps {
  children: ReactNode;
  previewUrl: string | undefined;
}

export function VideoSelectorModal({ previewUrl, children }: VideoSelectorModalProps) {
  return (
    <DialogContent className="sm:max-w-[800px] h-[600px]">
      <DialogHeader>
        <DialogTitle>Selecione um Vídeo</DialogTitle>
        <DialogDescription className="flex flex-col gap-2">
          Faça upload de um novo vídeo ou selecione um carregado anteriormente.

          {children}
        </DialogDescription>
      </DialogHeader>
      <Carousel previewUrl={previewUrl} />
      <DialogFooter className="self-end">
        <Button type="submit">Save changes</Button>
      </DialogFooter>
    </DialogContent>
  );
}
