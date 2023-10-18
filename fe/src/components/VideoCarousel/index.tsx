import { api } from "@/lib/axios";
import { useCallback, useEffect, useState } from "react";
import { Carousel } from "@material-tailwind/react";
import useUploadFile from "@/hooks/useUploadFile";

interface Video {
  id: string;
  name: string;
  path: string;
  thumbnail: {
    frameImagePath: string;
  }[];
  transcription?: string;
}

export function VideoCarousel() {
  const [videos, setVideos] = useState<Video[] | null>([]);

  const { handleSelectAudioFileFromDatabase } = useUploadFile();

  const loadVideos = useCallback(async () => {
    const response = await api.get('/videos');

    setVideos(response.data);
  }, [])

  useEffect(() => {
    loadVideos();
  }, [loadVideos])

  return (
    <Carousel className="rounded-sm">
      {videos?.map(video => {
        const [, frameImagePath] = video.thumbnail[0].frameImagePath.split("\\tmp\\");

        return (
          <img
            key={video.id}
            src={`http://localhost:3333/tmp/${frameImagePath}`}
            alt="image 1"
            className="h-full w-full object-cover rounded-sm aspect-video cursor-pointer hover:scale-90 hover:border- transition duration-200"
            onClick={() => handleSelectAudioFileFromDatabase(video.id)}
          />
        )
      })}
    </Carousel>
  );
}
