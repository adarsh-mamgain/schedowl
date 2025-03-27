import {
  X,
  Edit2,
  Trash2,
  Check,
  Clock,
  User,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import Button from "@/src/components/Button";
import { PostStatus } from "@prisma/client";
import dayjs from "dayjs";
import { useState } from "react";
import LexicalEditor from "./LexicalEditor";
import Image from "next/image";

interface Post {
  id: string;
  type: string;
  content: string;
  scheduledFor: string;
  status: PostStatus;
  createdById: string;
  mediaIds?: string[];
  socialAccount: {
    id: string;
    name: string;
    type: string;
    metadata: {
      picture: string | null;
    };
  };
  createdBy: {
    id: string;
    name: string;
    image: string | null;
  };
  errorMessage?: string | null;
  retryCount?: number;
  media?: Array<{
    media: {
      id: string;
      type: string;
      url: string;
      filename: string;
    };
  }>;
}

interface PostDialogProps {
  post: Post;
  onClose: () => void;
  onCancelPost: (postId: string) => Promise<void>;
  onEditPost: (postId: string) => void;
  onApprovePost?: (postId: string) => Promise<void>;
  onUpdatePost: (postId: string, content: string) => Promise<void>;
}

export default function PostDialog({
  post,
  onClose,
  onCancelPost,
  onEditPost,
  onApprovePost,
  onUpdatePost,
}: PostDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await onUpdatePost(post.id, editedContent);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update post:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: PostStatus) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-100 text-green-800";
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "RETRYING":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  console.log("post", post);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b">
          <div className="flex items-center gap-4">
            {post.socialAccount.metadata.picture && (
              <Image
                src={post.socialAccount.metadata.picture}
                alt={post.socialAccount.name}
                width={40}
                height={40}
                className="rounded-full"
              />
            )}
            <div>
              <h3 className="text-lg font-semibold">
                {post.socialAccount.name}
              </h3>
              <p className="text-sm text-gray-600">{post.type}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {post.status === "SCHEDULED" && (
              <Button
                variant="danger"
                size="small"
                onClick={() => onCancelPost(post.id)}
              >
                <Trash2 size={16} className="mr-1" />
                Cancel
              </Button>
            )}
            {post.status === "DRAFT" && onApprovePost && (
              <Button
                variant="primary"
                size="small"
                onClick={() => onApprovePost(post.id)}
              >
                <Check size={16} className="mr-1" />
                Approve
              </Button>
            )}
            {post.status !== "PUBLISHED" && (
              <Button
                variant="secondary"
                size="small"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit2 size={16} className="mr-1" />
                {isEditing ? "Cancel Edit" : "Edit"}
              </Button>
            )}
            <Button variant="secondary" size="small" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Schedule */}
          <div className="flex items-center gap-4">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                post.status
              )}`}
            >
              {post.status}
            </span>
            <div className="flex items-center text-sm text-gray-600">
              <Clock size={16} className="mr-1" />
              {dayjs(post.scheduledFor).format("MMMM D, YYYY h:mm A")}
            </div>
          </div>

          {/* Author */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User size={16} />
            <span>Posted by {post.createdBy.name}</span>
          </div>

          {/* Content */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Content</h4>
            {isEditing ? (
              <div className="space-y-4">
                <LexicalEditor
                  accounts={[]}
                  selectedAccounts={[]}
                  onChange={setEditedContent}
                  onAccountsChange={() => {}}
                  onPost={handleUpdate}
                  initialPost={{
                    ...post,
                    content: editedContent,
                    socialAccountIds: [post.socialAccount.id],
                    status:
                      post.status === "PUBLISHED"
                        ? "PUBLISHED"
                        : post.status === "SCHEDULED"
                        ? "SCHEDULED"
                        : "DRAFT",
                  }}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="small"
                    onClick={handleUpdate}
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Updating..." : "Update"}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-800 whitespace-pre-wrap">
                {post.content}
              </p>
            )}
          </div>

          {/* Media */}
          {post.media && post.media.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Media</h4>
              <div className="grid grid-cols-4 gap-4">
                {post.media.map(({ media }) => (
                  <div key={media.id} className="relative aspect-square">
                    <Image
                      src={media.url}
                      alt={media.filename}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Information */}
          {post.errorMessage && (
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle size={20} className="text-red-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Error</h4>
                  <p className="text-sm text-red-700">{post.errorMessage}</p>
                  {post.retryCount && post.retryCount > 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      Retry attempts: {post.retryCount}/5
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
