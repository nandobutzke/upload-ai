import { Github, Wand2 } from 'lucide-react';
import { Button } from './components/shadcn/ui/Button';
import { Separator } from './components/shadcn/ui/Separator';
import { Textarea } from "./components/shadcn/ui/Textarea";
import { Label } from "./components/shadcn/ui/Label";
import VideoInputForm from "./components/VideoInputForm";
import useUploadFile, { UploadFileProvider } from "./hooks/useUploadFile";

export function App() {
  return (
    <UploadFileProvider>
      <Workspace />
    </UploadFileProvider>
  );
}

function Workspace() {
  const {
    transcription,
    title,
    description,
    hasGeneration,
    statusLabel,
    canGenerate,
    isGenerating,
    handleGenerate,
  } = useUploadFile();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-3 flex items-center justify-between border-b">
        <h1 className="text-xl font-bold">upload.ai</h1>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Desenvolvido com 💜 no NWL da Rocketseat</span>

          <Separator orientation="vertical" className="h-6" />

          <Button variant="outline">
            <Github className="w-4 h-4 mr-2" />
            Github
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 flex gap-6">
        <div className="flex flex-col flex-1 gap-4">
          <div className="space-y-2 flex-1 flex flex-col">
            <Label htmlFor="transcription">Transcrição</Label>
            <Textarea
              id="transcription"
              className="resize-none p-4 leading-relaxed flex-1 min-h-[240px]"
              placeholder="A transcrição aparece aqui quando o processamento terminar."
              readOnly
              value={transcription}
            />
          </div>

          <p className="text-sm text-muted-foreground">
            Status: {statusLabel}. O botão de gerar libera quando a transcrição fica concluída.
          </p>

          <Button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-fit"
          >
            {isGenerating ? 'Gerando...' : 'Gerar título e descrição'}
            <Wand2 className="w-4 h-4 ml-2" />
          </Button>

          {hasGeneration && (
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Textarea
                  id="title"
                  readOnly
                  value={title}
                  className="resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  readOnly
                  value={description}
                  className="min-h-[120px] resize-none"
                />
              </div>
            </div>
          )}
        </div>

        <aside className="w-80 space-y-6">
          <VideoInputForm />
        </aside>
      </main>
    </div>
  );
}
