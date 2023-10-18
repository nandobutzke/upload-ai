/*
  Warnings:

  - You are about to drop the `Prompt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Thumbnail` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Video` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Thumbnail" DROP CONSTRAINT "Thumbnail_video_id_fkey";

-- DropTable
DROP TABLE "Prompt";

-- DropTable
DROP TABLE "Thumbnail";

-- DropTable
DROP TABLE "Video";

-- CreateTable
CREATE TABLE "video" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "transcription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "template" TEXT NOT NULL,

    CONSTRAINT "prompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thumbnail" (
    "id" TEXT NOT NULL,
    "frameImagePath" TEXT NOT NULL,
    "video_id" UUID NOT NULL,

    CONSTRAINT "thumbnail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "thumbnail_video_id_key" ON "thumbnail"("video_id");

-- AddForeignKey
ALTER TABLE "thumbnail" ADD CONSTRAINT "thumbnail_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
