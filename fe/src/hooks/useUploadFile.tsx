import { api } from "@/lib/axios";
import { ChangeEvent, FormEvent, ReactNode, createContext, useContext, useEffect, useRef, useState } from "react";

type Status = 'waiting' | 'uploading' | 'transcribing' | 'completed' | 'failed';

type UploadResponse = {
  id: string;
  url: string;
};

type TranscriptionResponse = {
  status: 'processing' | 'completed' | 'failed' | string;
  text?: string;
};

type GenerationResponse = {
  title: string;
  description: string;
};

type UploadFileContextType = {
  previewUrl?: string;
  selectedFileName: string;
  status: Status;
  statusLabel: string;
  errorMessage: string;
  transcription: string;
  title: string;
  description: string;
  hasGeneration: boolean;
  isGenerating: boolean;
  canUpload: boolean;
  canGenerate: boolean;
  handleCancelUpload: () => void;
  handleSelectedFile: (event: ChangeEvent<HTMLInputElement>) => void;
  handleUploadVideo: (event: FormEvent<HTMLFormElement>) => void;
  handleGenerate: () => void;
};

const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000;

const statusLabels: Record<Status, string> = {
  waiting: 'Aguardando',
  uploading: 'Enviando',
  transcribing: 'Transcrevendo',
  completed: 'Concluído',
  failed: 'Falhou',
};

const UploadFileContext = createContext<UploadFileContextType | null>(null);

function isMp4(file: File) {
  return file.name.toLowerCase().endsWith('.mp4');
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function errorText(error: unknown, fallback: string) {
  if (error instanceof Error && error.message && !('isAxiosError' in error)) {
    return error.message;
  }

  return fallback;
}

interface UploadFileProviderProps {
  children: ReactNode;
}

export function UploadFileProvider({ children }: UploadFileProviderProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('waiting');
  const [errorMessage, setErrorMessage] = useState('');
  const [transcription, setTranscription] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hasGeneration, setHasGeneration] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const runIdRef = useRef(0);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!videoFile) {
      setPreviewUrl(undefined);
      return;
    }

    const url = URL.createObjectURL(videoFile);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [videoFile]);

  useEffect(() => {
    return () => {
      runIdRef.current += 1;
    };
  }, []);

  function clearResult() {
    setUploadId(null);
    setTranscription('');
    setTitle('');
    setDescription('');
    setHasGeneration(false);
    setIsGenerating(false);
  }

  function handleCancelUpload() {
    runIdRef.current += 1;
    busyRef.current = false;
    setVideoFile(null);
    clearResult();
    setStatus('waiting');
    setErrorMessage('');
  }

  function handleSelectedFile(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    event.target.value = '';

    if (!selectedFile) {
      return;
    }

    runIdRef.current += 1;
    busyRef.current = false;
    clearResult();

    if (!isMp4(selectedFile)) {
      setVideoFile(null);
      setStatus('failed');
      setErrorMessage('O arquivo precisa ser .mp4.');
      return;
    }

    setErrorMessage('');
    setStatus('waiting');
    setVideoFile(selectedFile);
  }

  async function pollTranscription(id: string, runId: number) {
    const deadline = Date.now() + POLL_TIMEOUT_MS;

    while (runIdRef.current === runId) {
      let data: TranscriptionResponse | null = null;

      try {
        const response = await api.get<TranscriptionResponse>(`/transcriptions/${id}`);
        data = response.data;
      } catch {
        data = null;
      }

      if (runIdRef.current !== runId) {
        return null;
      }

      if (data?.status === 'completed') {
        return data.text ?? '';
      }

      if (data?.status === 'failed') {
        throw new Error('A transcrição falhou.');
      }

      const remaining = deadline - Date.now();

      if (remaining <= 0) {
        throw new Error(
          data
            ? 'A transcrição excedeu 10 minutos.'
            : 'Não foi possível consultar a transcrição.'
        );
      }

      await wait(Math.min(POLL_INTERVAL_MS, remaining));
    }

    return null;
  }

  async function handleUploadVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busyRef.current) {
      return;
    }

    if (!videoFile || !isMp4(videoFile)) {
      setVideoFile(null);
      setStatus('failed');
      setErrorMessage('O arquivo precisa ser .mp4.');
      return;
    }

    const runId = ++runIdRef.current;
    const file = videoFile;
    busyRef.current = true;
    clearResult();
    setErrorMessage('');
    setStatus('uploading');

    try {
      const { data } = await api.post<UploadResponse>('/uploads');

      if (runIdRef.current !== runId) {
        return;
      }

      const putResponse = await fetch(data.url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'video/mp4',
        },
        body: file,
      });

      if (runIdRef.current !== runId) {
        return;
      }

      if (!putResponse.ok) {
        throw new Error('Não foi possível enviar o vídeo.');
      }

      setUploadId(data.id);
      setStatus('transcribing');

      const text = await pollTranscription(data.id, runId);

      if (text === null || runIdRef.current !== runId) {
        return;
      }

      setTranscription(text);
      setStatus('completed');
    } catch (error) {
      if (runIdRef.current !== runId) {
        return;
      }

      setStatus('failed');
      setErrorMessage(errorText(error, 'Não foi possível enviar o vídeo.'));
    } finally {
      if (runIdRef.current === runId) {
        busyRef.current = false;
      }
    }
  }

  async function handleGenerate() {
    if (status !== 'completed' || !uploadId || isGenerating) {
      return;
    }

    const runId = runIdRef.current;
    const id = uploadId;
    setIsGenerating(true);
    setErrorMessage('');

    try {
      const { data } = await api.post<GenerationResponse>('/generations', {
        id,
      });

      if (runIdRef.current !== runId) {
        return;
      }

      setTitle(data.title);
      setDescription(data.description);
      setHasGeneration(true);
    } catch {
      if (runIdRef.current !== runId) {
        return;
      }

      setErrorMessage('Não foi possível gerar o título e a descrição.');
    } finally {
      if (runIdRef.current === runId) {
        setIsGenerating(false);
      }
    }
  }

  const canUpload = Boolean(videoFile) && (status === 'waiting' || status === 'failed');
  const canGenerate = status === 'completed' && !isGenerating && Boolean(uploadId);

  return (
    <UploadFileContext.Provider value={{
      previewUrl,
      selectedFileName: videoFile?.name ?? '',
      status,
      statusLabel: statusLabels[status],
      errorMessage,
      transcription,
      title,
      description,
      hasGeneration,
      isGenerating,
      canUpload,
      canGenerate,
      handleCancelUpload,
      handleSelectedFile,
      handleUploadVideo,
      handleGenerate,
    }}>
      {children}
    </UploadFileContext.Provider>
  );
}

export default function useUploadFile() {
  const context = useContext(UploadFileContext);

  if (!context) {
    throw new Error('useUploadFile must be used within UploadFileProvider');
  }

  return context;
}
