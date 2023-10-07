import { api } from "@/lib/axios";
import { loadFFmpeg } from "@/lib/ffmpeg";
import { fetchFile } from '@ffmpeg/util';
import { ChangeEvent, RefObject, FormEvent, useMemo, createContext, ReactNode, useState, useRef, useContext } from "react";

interface UploadFileProviderProps {
  children: ReactNode;
  onVideoUploaded: (videoId: string) => void;
}

type Status = 'waiting' | 'converting' | 'uploading' | 'generating' | 'success';

type UploadFileContextType = {
  previewUrl: string | undefined;
  imagePreviewFromDatabase: string;
  handleSelectedFile: (event: ChangeEvent<HTMLInputElement>) => void;
  handleUploadVideo: (event: FormEvent<HTMLFormElement>) => void;
  handleSelectAudioFileFromDatabase: (audioFileId: string) => void;
  status: Status;
  statusMessages: {
    converting: string,
    uploading: string,
    generating: string,
    success: string,
  };
  promptInputRef: RefObject<HTMLTextAreaElement>
}

const UploadFileContext = createContext<UploadFileContextType>({} as UploadFileContextType);

const statusMessages = {
  converting: 'Convertendo...',
  uploading: 'Transcrevendo...',
  generating: 'Carregando...',
  success: 'Sucesso!',
}

export function UploadFileProvider({ children, onVideoUploaded }: UploadFileProviderProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>('waiting');
  const [imagePreviewFromDatabase, setImagePreviewFromDatabase] = useState<string>('');

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
      'output.mp3',
      '-vf',
      'select=gte(n\\,1),scale=320:240,tile=1x1:0:0,setsar=sar=1'
    ]);

    await ffmpeg.exec([
      '-i',
      'input.mp4',
      '-ss',
      '00:00:05',
      '-vframes',
      '1',
      'frame.jpg'
    ]);

    const audioData = await ffmpeg.readFile('output.mp3');
    const audioFileBlob = new Blob([audioData], { type: 'audio/mpeg' });
    const audioFile = new File([audioFileBlob], 'audio.mp3', {
      type: 'audio/mpeg'
    });

    const frameImageBlob = await ffmpeg.readFile('frame.jpg');
    const frameImageFileBlob = new Blob([frameImageBlob], { type: 'image/jpeg' });
    const frameImageFile = new File([frameImageFileBlob], 'frame.jpg', {
      type: 'image/jpeg'
    });

    console.log('Convert finished', frameImageFile);

    return { audioFile, frameImageFile };
  }

  function handleSelectedFile(event: ChangeEvent<HTMLInputElement>) {
    const { files } = event.currentTarget;

    if (!files) {
      return;
    }

    const selectedFile = files[0];

    setVideoFile(selectedFile);
  }

  async function handleSelectAudioFileFromDatabase(audioFileId: string) {
    const { data } = await api.get(`/videos/${audioFileId}`);

    console.log({ data })

    const previewImage = data.Thumbnail[0].frameImagePath.split("\\tmp\\");

    setImagePreviewFromDatabase(previewImage[1]);
    onVideoUploaded(data.id);
  }

  async function handleUploadVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const prompt = promptInputRef.current?.value;

    if (!videoFile) {
      return;
    }

    setStatus('converting');

    const { audioFile, frameImageFile } = await convertVideoToAudio(videoFile);

    setStatus('uploading');

    const data = new FormData();

    data.append('audio', audioFile);
    data.append('frameImageFile', frameImageFile);

    try {
      const response = await api.post('/videos', data);

      const videoId = response.data.video.id;

      setStatus('generating');

      await api.post(`/videos/${videoId}/transcription`, {
        prompt
      });

      setStatus('success');

      onVideoUploaded(videoId);
    } catch (error) {
      console.error('Error uploading video:', error);
    }
  }

  const previewUrl = useMemo(() => {
    if (!videoFile) {
      return undefined;
    }

    return URL.createObjectURL(videoFile);
  }, [videoFile]);


  return (
    <UploadFileContext.Provider value={{
      previewUrl,
      imagePreviewFromDatabase,
      handleSelectedFile,
      handleUploadVideo,
      handleSelectAudioFileFromDatabase,
      status,
      statusMessages,
      promptInputRef
    }}>
      {children}
    </UploadFileContext.Provider>
  );
}

export default function useUploadFile() {
  const context = useContext(UploadFileContext);

  return context;
}
