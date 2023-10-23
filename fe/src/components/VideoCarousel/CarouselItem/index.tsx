import useUploadFile from "@/hooks/useUploadFile";

interface CarouselItemProps {
  id: string;
  frameImagePath: string;
  isSelected: boolean;
  onSelectVideo: () => void;
}

export function CarouselItem({ id, frameImagePath, isSelected, onSelectVideo }: CarouselItemProps) {
  const { handleSelectAudioFileFromDatabase, imagePreviewFromDatabase } = useUploadFile();

  function handleItemClick() {
    handleSelectAudioFileFromDatabase(id);
    onSelectVideo();
  }

  return (
    <img
      src={`http://localhost:3333/tmp/${frameImagePath}`}
      alt="image 1"
      onClick={handleItemClick}
      data-selected={isSelected === true && imagePreviewFromDatabase !== ''}
      className="h-full w-full object-cover rounded-sm aspect-video cursor-pointer hover:scale-90 transition duration-200 data-[selected=true]:border-white data-[selected=true]:border-2"
    />
  );
}
