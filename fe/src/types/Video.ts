export interface Video {
  id: string;
  name: string;
  title: string;
  prompt?: string;
  path: string;
  thumbnail: {
    frameImagePath: string;
  }[];
  transcription?: string;
}
