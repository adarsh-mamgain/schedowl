"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Upload,
  Image as ImageIcon,
  Video,
  File,
  FileQuestion,
  Trash2,
  X,
} from "lucide-react";
import Button from "@/src/components/Button";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { MediaAttachment } from "@prisma/client";
import axios from "axios";
import ConfirmationDialog from "@/src/components/ui/ConfirmationDialog";

export default function MediaPage() {
  const [isUploading, setIsUploading] = useState(false);
  const { data: session } = useSession();
  const [mediaFiles, setMediaFiles] = useState<MediaAttachment[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaAttachment | null>(
    null
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<MediaAttachment | null>(
    null
  );

  useEffect(() => {
    if (session?.organisation?.id) {
      fetchMedia();
    }
  }, [session?.organisation?.id]);

  const fetchMedia = async () => {
    try {
      const response = await axios.get("/api/media");
      setMediaFiles(response.data);
    } catch (error) {
      console.error("Error fetching media:", error);
      toast.error("Failed to fetch media files");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!session?.organisation?.id) {
      toast.error("No organisation selected");
      return;
    }

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload file");
        }

        const data = await response.json();
        setMediaFiles((prev) => [data, ...prev]);
        toast.success(`Successfully uploaded ${file.name}`);
      }
    } catch (error) {
      toast.error("Failed to upload files");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!mediaToDelete) return;

    try {
      const response = await axios.delete(`/api/media/${mediaToDelete.id}`);
      if (response.data.success) {
        setMediaFiles((prev) =>
          prev.filter((media) => media.id !== mediaToDelete.id)
        );
        toast.success("Media deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting media:", error);
      toast.error("Failed to delete media");
    } finally {
      setIsDeleteDialogOpen(false);
      setMediaToDelete(null);
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "IMAGE":
        return <ImageIcon className="w-6 h-6" />;
      case "VIDEO":
        return <Video className="w-6 h-6" />;
      default:
        return <File className="w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-semibold text-[#101828]">Media Library</h1>
          <p className="text-sm text-[#475467]">
            Manage your media files from here.
          </p>
        </div>
        <div className="relative">
          <label htmlFor="media-upload">
            <Button
              size="small"
              disabled={isUploading}
              onClick={() => document.getElementById("media-upload")?.click()}
            >
              <Upload className="w-4 h-4" />
              {isUploading ? "Uploading..." : "Upload Media"}
            </Button>
          </label>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileUpload}
            className="hidden"
            id="media-upload"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {mediaFiles.length === 0 && (
          <div className="flex flex-col items-center justify-center col-span-full text-center text-gray-500 min-h-[50vh]">
            <FileQuestion className="w-12 h-12 text-gray-400 mb-2" />
            <p>No media files found</p>
          </div>
        )}
        {mediaFiles.map((media) => (
          <div
            key={media.id}
            className="group relative border rounded-lg p-4 space-y-2 hover:shadow-md transition-shadow"
          >
            <button
              onClick={() => {
                setMediaToDelete(media);
                setIsDeleteDialogOpen(true);
              }}
              className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div
              className="bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer"
              onClick={() => {
                setSelectedMedia(media);
                setIsPreviewOpen(true);
              }}
            >
              {media.type === "IMAGE" ? (
                <div className="aspect-video relative w-full h-full">
                  <Image
                    src={media.url}
                    alt={media.filename}
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              ) : media.type === "VIDEO" ? (
                <video
                  src={media.url}
                  className="w-full h-full object-cover"
                  controls
                />
              ) : (
                getMediaIcon(media.type)
              )}
            </div>
            <div className="space-y-1">
              <p className="font-medium truncate">{media.filename}</p>
              <p className="text-sm text-gray-500">
                {(media.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && selectedMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 overflow-hidden">
          <button
            onClick={() => setIsPreviewOpen(false)}
            className="absolute top-4 right-4 rounded-full bg-gray-100 hover:bg-gray-200 p-2"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
            {selectedMedia.type === "IMAGE" ? (
              <div className="relative w-full aspect-video">
                <Image
                  src={selectedMedia.url}
                  alt={selectedMedia.filename}
                  className="rounded-lg"
                  fill
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  priority
                />
              </div>
            ) : selectedMedia.type === "VIDEO" ? (
              <video
                src={selectedMedia.url}
                className="w-full h-auto rounded-lg"
                controls
              />
            ) : (
              <div className="bg-white p-8 rounded-lg text-center">
                <File className="w-12 h-12 mx-auto mb-4" />
                <p className="text-lg font-medium">{selectedMedia.filename}</p>
                <p className="text-sm text-gray-500">
                  {(selectedMedia.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setMediaToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Media"
        description={`Are you sure you want to delete "${mediaToDelete?.filename}"? This action cannot be undone.`}
      />
    </div>
  );
}
