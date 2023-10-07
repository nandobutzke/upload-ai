/*
  Warnings:

  - You are about to drop the column `user_id` on the `Thumbnail` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[video_id]` on the table `Thumbnail` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `video_id` to the `Thumbnail` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Thumbnail" DROP CONSTRAINT "Thumbnail_user_id_fkey";

-- DropIndex
DROP INDEX "Thumbnail_user_id_key";

-- AlterTable
ALTER TABLE "Thumbnail" DROP COLUMN "user_id",
ADD COLUMN     "video_id" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Thumbnail_video_id_key" ON "Thumbnail"("video_id");

-- AddForeignKey
ALTER TABLE "Thumbnail" ADD CONSTRAINT "Thumbnail_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "Video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
