import { api } from "@/lib/axios";
import { useCallback, useEffect, useState } from "react";
import { Carousel } from "@material-tailwind/react";
import { Separator } from "../shadcn/ui/Separator";
import { CarouselItem } from "./CarouselItem";
import { Video } from "@/types/Video";

export function VideoCarousel() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');

  const loadVideos = useCallback(async () => {
    const { data } = await api.get('/videos');

    setVideos(data);
  }, [])

  useEffect(() => {
    loadVideos();
  }, [loadVideos])

  function handleSelectVideo(id: string) {
    setSelectedVideoId(id);
  }

  return (
    <>
      {videos.length > 0 && <Separator />}

      <Carousel className="rounded-sm">
        {videos?.map(video => {
          const [, frameImagePath] = video.thumbnail[0].frameImagePath.split("\\tmp\\");

          return (
            <CarouselItem
              key={video.id}
              id={video.id}
              isSelected={selectedVideoId === video.id}
              onSelectVideo={() => handleSelectVideo(video.id)}
              frameImagePath={frameImagePath}
            />
          )
        })}
      </Carousel>
    </>
  );
}
