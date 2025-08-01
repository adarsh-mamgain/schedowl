"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { ListNode, ListItemNode } from "@lexical/list";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
  FORMAT_TEXT_COMMAND,
  COMMAND_PRIORITY_LOW,
  $getRoot,
  $createParagraphNode,
  $createTextNode,
} from "lexical";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  $createListItemNode,
} from "@lexical/list";
import {
  Bold,
  Calendar,
  Check,
  Italic,
  List,
  Plus,
  SendHorizonal,
  X,
  Upload,
  Loader2,
  ImagePlusIcon,
  Sparkles,
} from "lucide-react";
import Button from "@/src/components/Button";
import { toast } from "react-toastify";
import axios from "axios";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import Image from "next/image";

// Add Unicode support for LinkedIn posts
const LINKEDIN_UNICODE_SUPPORT = {
  // Basic formatting
  bold: "\u{1D400}", // Mathematical Bold A
  italic: "\u{1D434}", // Mathematical Italic A
  underline: "\u{0332}", // Combining Low Line

  // Special characters
  bullet: "\u{2022}", // Bullet
  arrow: "\u{2192}", // Right Arrow
  checkmark: "\u{2713}", // Check Mark
  star: "\u{2605}", // Black Star
  heart: "\u{2764}", // Heavy Black Heart

  // Emojis
  smile: "\u{1F642}", // Slightly Smiling Face
  thumbsUp: "\u{1F44D}", // Thumbs Up
  rocket: "\u{1F680}", // Rocket
  lightBulb: "\u{1F4A1}", // Light Bulb
  calendar: "\u{1F4C5}", // Calendar
};

interface UnicodeToolbarPluginProps {
  setShowMediaLibrary: (show: boolean) => void;
  setShowAIModal: (show: boolean) => void;
}

function UnicodeToolbarPlugin({
  setShowMediaLibrary,
  setShowAIModal,
}: UnicodeToolbarPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateToolbar = () => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
    }
  };

  React.useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  const insertEmoji = (emoji: { native: string }) => {
    editor.update(() => {
      const selection = $getSelection();
      if (selection) {
        selection.insertText(emoji.native);
        setShowEmojiPicker(false);
      }
    });
  };

  const insertUnicode = (unicode: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if (selection) {
        selection.insertText(unicode);
      }
    });
  };

  return (
    <div className="flex items-center justify-between space-x-1 p-1 border-y border-y-[#EAECF0] rounded-t-xl">
      <div className="flex items-center space-x-1">
        <button
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
          className={`p-2 hover:bg-gray-100 rounded ${
            isBold ? "text-blue-500" : "text-[#98A2B3]"
          }`}
          title="Bold"
        >
          <Bold size={16} strokeWidth={4} />
        </button>
        <button
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
          className={`p-2 hover:bg-gray-100 rounded ${
            isItalic ? "text-blue-500" : "text-[#98A2B3]"
          }`}
          title="Italic"
        >
          <Italic size={16} strokeWidth={4} />
        </button>
        <button
          onClick={() =>
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
          }
          className="text-[#98A2B3] p-2 hover:bg-gray-100 rounded"
          title="Bullet List"
        >
          <List size={16} strokeWidth={4} />
        </button>
        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-xs text-[#98A2B3] p-2 hover:bg-gray-100 rounded"
            title="Insert Emoji"
          >
            😀
          </button>
          {showEmojiPicker && (
            <div className="absolute z-10 top-full left-0 mt-1">
              <Picker
                data={data}
                onEmojiSelect={insertEmoji}
                theme="light"
                emojiSize={20}
                emojiButtonSize={28}
              />
            </div>
          )}
        </div>
        <div className="h-4 w-px bg-gray-300 mx-1" />
        <button
          onClick={() => insertUnicode(LINKEDIN_UNICODE_SUPPORT.bullet)}
          className="text-[#98A2B3] p-2 hover:bg-gray-100 rounded"
          title="Bullet Point"
        >
          •
        </button>
        <button
          onClick={() => insertUnicode(LINKEDIN_UNICODE_SUPPORT.arrow)}
          className="text-[#98A2B3] p-2 hover:bg-gray-100 rounded"
          title="Arrow"
        >
          →
        </button>
        <button
          onClick={() => insertUnicode(LINKEDIN_UNICODE_SUPPORT.checkmark)}
          className="text-[#98A2B3] p-2 hover:bg-gray-100 rounded"
          title="Checkmark"
        >
          ✓
        </button>
        <div className="h-4 w-px bg-gray-300 mx-1" />
        <button
          onClick={() => setShowAIModal(true)}
          className="text-[#98A2B3] p-2 hover:bg-gray-100 rounded bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white transition-all duration-300"
          title="AI Generate"
        >
          <Sparkles size={16} />
        </button>
      </div>
      <div>
        <button
          onClick={() => setShowMediaLibrary(true)}
          className="p-2 hover:bg-gray-100 rounded text-[#98A2B3]"
          title="Add Media"
        >
          <ImagePlusIcon size={16} />
        </button>
      </div>
    </div>
  );
}

function OnChangePlugin({ onChange }: { onChange: (text: string) => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const textContent = $getRoot().getTextContent();
        onChange(textContent);
      });
    });
  }, [editor, onChange]);

  return null;
}

interface LinkedInAccount {
  id: string;
  name: string;
  type: string;
  metadata?: {
    picture?: string;
  };
}

interface MediaAttachment {
  id: string;
  url: string;
  type: string;
  filename: string;
  preview?: string;
}

interface Post {
  id?: string;
  content: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED";
  scheduledFor?: string;
  mediaIds?: string[];
  socialAccountIds: string[];
}

function InlineAccountSelect({
  accounts,
  selectedAccounts,
  onChange,
}: {
  accounts: LinkedInAccount[];
  selectedAccounts: string[];
  onChange: (ids: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleAccount = (accountId: string) => {
    const newSelected = selectedAccounts.includes(accountId)
      ? selectedAccounts.filter((id) => id !== accountId)
      : [...selectedAccounts, accountId];
    onChange(newSelected);
  };

  const removeAccount = (accountId: string) => {
    onChange(selectedAccounts.filter((id) => id !== accountId));
  };

  const filteredAccounts = accounts.filter((account) =>
    `${account.name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Account:</span>

        {/* Selected account chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {selectedAccounts.map((accountId) => {
            const account = accounts.find((a) => a.id === accountId);
            if (!account) return null;
            return (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeAccount(account.id);
                }}
                key={account.id}
                className="flex items-center gap-1 px-2 py-1 bg-[#1256c420] hover:bg-[#0e3e9a50] text-blue-800 rounded-full text-sm"
              >
                <span>{account.name}</span>
                <span>
                  <X size={12} />
                </span>
              </button>
            );
          })}

          {/* Select button */}
          <Button
            onClick={() => setIsOpen(!isOpen)}
            variant="secondary"
            size="small"
          >
            <Plus size={16} />
          </Button>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1 w-64 bg-white border border-[#ECECED] rounded-xl shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="">
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border-b border-[#ECECED] focus:outline-none focus:bg-[#ECECED]"
            />
          </div>

          {/* Account list */}
          <div className="max-h-48 overflow-y-auto">
            {filteredAccounts.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No accounts found
              </div>
            ) : (
              filteredAccounts.map((account) => (
                <div
                  key={account.id}
                  onClick={() => toggleAccount(account.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                    selectedAccounts.includes(account.id)
                      ? "bg-[#1256c420]"
                      : ""
                  }`}
                >
                  <div className="flex-1">
                    <span className="text-gray-900">{account.name}</span>
                  </div>
                  {selectedAccounts.includes(account.id) && <Check size={16} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface MediaLibraryItem extends MediaAttachment {
  selected?: boolean;
}

function MediaLibraryModal({
  isOpen,
  onClose,
  onSelect,
  selectedMedia,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaLibraryItem[]) => void;
  selectedMedia: MediaLibraryItem[];
}) {
  const [mediaItems, setMediaItems] = useState<MediaLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMediaLibrary = useCallback(async () => {
    try {
      const response = await axios.get("/api/media");
      const items = response.data.map((item: MediaLibraryItem) => ({
        ...item,
        selected: selectedMedia.some((selected) => selected.id === item.id),
      }));
      setMediaItems(items);
    } catch {
      toast.error("Failed to fetch media library");
    } finally {
      setLoading(false);
    }
  }, [selectedMedia]);

  useEffect(() => {
    if (isOpen) {
      fetchMediaLibrary();
    }
  }, [isOpen, fetchMediaLibrary]);

  const handleMediaUpload = async (files: FileList) => {
    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("file", file);
    });

    try {
      await axios.post("/api/media/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Fetch media again after successful upload
      await fetchMediaLibrary();
      toast.success("Media uploaded successfully!");
    } catch {
      toast.error("Failed to upload media");
    } finally {
      setUploading(false);
    }
  };

  const toggleMediaSelection = (mediaId: string) => {
    setMediaItems((prev) =>
      prev.map((item) =>
        item.id === mediaId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleSelect = () => {
    const selectedItems = mediaItems.filter((item) => item.selected);
    onSelect(selectedItems);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[800px] h-[600px] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#ECECED]">
          <h2 className="text-lg font-semibold">Media Library</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar */}
          <div className="w-64 border-r border-[#ECECED] p-4">
            <div className="space-y-4">
              <div>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) =>
                    e.target.files && handleMediaUpload(e.target.files)
                  }
                  className="hidden"
                  ref={fileInputRef}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Upload size={16} />
                  )}
                  Upload Media
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin" size={24} />
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {mediaItems.map((item) => (
                  <div
                    key={item.id}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 ${
                      item.selected ? "border-blue-500" : "border-transparent"
                    }`}
                    onClick={() => toggleMediaSelection(item.id)}
                  >
                    <Image
                      src={item.url}
                      alt={item.filename}
                      className="aspect-video"
                      width={128}
                      height={128}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                      {item.selected && (
                        <Check className="text-white" size={24} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-[#ECECED] flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSelect}>Select Media</Button>
        </div>
      </div>
    </div>
  );
}

function AIModal({
  isOpen,
  onClose,
  onInsert,
}: {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (text: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      const response = await axios.post("/api/ai/generate", { prompt });
      setGeneratedText(response.data.text);
    } catch {
      toast.error("Failed to generate text");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsert = () => {
    if (generatedText) {
      onInsert(generatedText);
      onClose();
      setPrompt("");
      setGeneratedText("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[600px] max-h-[80vh] flex flex-col space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">AI Text Generation</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter your prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to generate..."
                className="w-full h-24 p-2 border border-[#ECECED] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {generatedText && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Generated Text
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border border-[#ECECED]">
                  {generatedText}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button size="small" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {!generatedText ? (
            <Button
              size="small"
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Generating...
                </>
              ) : (
                "Generate"
              )}
            </Button>
          ) : (
            <Button onClick={handleInsert}>Insert Text</Button>
          )}
        </div>
      </div>
    </div>
  );
}

const editorConfig = {
  namespace: "LinkedInUnicodeEditor",
  nodes: [ListNode, ListItemNode],
  theme: {
    root: "min-h-[200px] p-4 border rounded",
    text: {
      bold: "font-bold",
      italic: "italic",
      underline: "underline",
    },
    list: {
      ul: "list-disc list-inside",
      ol: "list-decimal list-inside",
    },
  },
  onError: console.error,
};

interface LexicalEditorProps {
  accounts: LinkedInAccount[];
  selectedAccounts: string[];
  onAccountsChange: (ids: string[]) => void;
  onChange: (text: string) => void;
  onPost: (post: Post) => Promise<void>;
  initialPost?: Post;
  onDraftSave?: (post: Post) => Promise<void>;
  requireApproval?: boolean;
  initialContent?: string;
}

function EditorContent({
  accounts = [],
  selectedAccounts = [],
  onAccountsChange,
  onChange,
  onPost,
  initialPost,
  onDraftSave,
  requireApproval = false,
  initialContent,
}: LexicalEditorProps) {
  const [editor] = useLexicalComposerContext();
  const [postContent, setPostContent] = useState(initialPost?.content || "");
  const [scheduleTime, setScheduleTime] = useState(
    initialPost?.scheduledFor || ""
  );
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaAttachment[]>(
    initialPost?.mediaIds?.map((id) => ({
      id,
      url: "",
      type: "IMAGE",
      filename: "",
      preview: "",
    })) || []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  useEffect(() => {
    onChange(postContent);
  }, [postContent, onChange]);

  useEffect(() => {
    if (initialContent) {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(initialContent));
        root.append(paragraph);
      });
    }
  }, [initialContent, editor]);

  const handleDraftSave = async () => {
    if (!onDraftSave) return;

    setIsLoading(true);
    try {
      await onDraftSave({
        content: postContent,
        status: "DRAFT",
        socialAccountIds: selectedAccounts,
        mediaIds: selectedMedia.map((media) => media.id),
      });
      toast.success("Draft saved successfully!");
    } catch {
      toast.error("Failed to save draft");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMedia = (index: number) => {
    setSelectedMedia((prev) => {
      const newMedia = [...prev];
      URL.revokeObjectURL(newMedia[index].preview || "");
      newMedia.splice(index, 1);
      return newMedia;
    });
  };

  const handlePost = async (isScheduled: boolean) => {
    setIsLoading(true);
    try {
      if (isScheduled && !scheduleTime) {
        toast.error("Please select a schedule time");
        return;
      }

      // Convert local time to UTC if scheduling
      const scheduledFor = isScheduled
        ? new Date(scheduleTime).toISOString()
        : undefined;

      // If approval is required, save as draft
      if (requireApproval) {
        await onPost({
          content: postContent,
          status: "DRAFT",
          scheduledFor,
          socialAccountIds: selectedAccounts,
          mediaIds: selectedMedia.map((media) => media.id),
        });
      } else {
        await onPost({
          content: postContent,
          status: isScheduled ? "SCHEDULED" : "PUBLISHED",
          scheduledFor,
          socialAccountIds: selectedAccounts,
          mediaIds: selectedMedia.map((media) => media.id),
        });
      }

      // Clear the editor
      editor.update(() => {
        const root = $getRoot();
        root.clear();
      });

      // Cleanup object URLs
      setSelectedMedia([]);
      setScheduleTime("");
      setIsScheduling(false);
    } catch {
      throw new Error(
        isScheduled ? "Failed to schedule post" : "Failed to publish post"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup object URLs
      selectedMedia.forEach((media) => {
        if (media.preview) URL.revokeObjectURL(media.preview);
      });
    };
  }, [selectedMedia]);

  const handleMediaLibrarySelect = (selectedMedia: MediaLibraryItem[]) => {
    setSelectedMedia((prev) => {
      const newMedia = [...prev];
      selectedMedia.forEach((media) => {
        if (!newMedia.some((item) => item.id === media.id)) {
          newMedia.push({
            id: media.id,
            url: media.url,
            type: media.type,
            filename: media.filename,
            preview: media.url,
          });
        }
      });
      return newMedia;
    });
  };

  const handleAITextInsert = (text: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // Split the text by newlines to handle paragraphs and lists
        const lines = text.split("\n");

        // Clear the current selection
        selection.removeText();

        // Process each line
        lines.forEach((line, index) => {
          // Add a paragraph node for each line
          const paragraph = $createParagraphNode();

          // Check if the line starts with a bullet point
          if (line.trim().startsWith("•")) {
            // Create a list item
            const listItem = $createListItemNode();
            const textNode = $createTextNode(line.trim().substring(1).trim());
            listItem.append(textNode);
            paragraph.append(listItem);
          } else {
            // Regular text
            const textNode = $createTextNode(line);
            paragraph.append(textNode);
          }

          // Append the paragraph to the root
          $getRoot().append(paragraph);

          // Add a line break after each line except the last one
          if (index < lines.length - 1) {
            const breakNode = $createParagraphNode();
            $getRoot().append(breakNode);
          }
        });
      }
    });
  };

  return (
    <div className="relative border-x border-x-[#EAECF0] rounded-l-xl rounded-r-xl">
      <UnicodeToolbarPlugin
        setShowMediaLibrary={setShowMediaLibrary}
        setShowAIModal={setShowAIModal}
      />
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            className="outline-none border-none p-4 h-[350px] overflow-scroll"
            aria-label="Post content"
          />
        }
        placeholder={
          <div className="absolute top-16 left-4 text-gray-400 pointer-events-none">
            Write something...
          </div>
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      <OnChangePlugin onChange={setPostContent} />
      <HistoryPlugin />
      <AutoFocusPlugin />
      <ListPlugin />

      {/* Media Preview Section */}
      {selectedMedia.length > 0 && (
        <div className="p-4">
          <div className="flex flex-wrap gap-4">
            {selectedMedia.map((media, index) => (
              <div key={media.id} className="relative group">
                <div className="w-32 h-32 rounded-lg overflow-hidden border border-[#EAECF0]">
                  <Image
                    src={media.preview || media.url}
                    alt={media.filename}
                    // className="object-contain w-full h-full"
                    className="object-cover w-full h-full"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <button
                  onClick={() => handleRemoveMedia(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account Selection */}
      <div className="flex items-center p-2 border-t border-t-[#EAECF0] text-sm">
        <InlineAccountSelect
          accounts={accounts}
          selectedAccounts={selectedAccounts}
          onChange={onAccountsChange}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between p-2 border-y border-y-[#EAECF0] rounded-b-xl">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="small"
            onClick={handleDraftSave}
            disabled={isLoading}
          >
            Save draft
          </Button>
        </div>
        <div className="relative flex gap-2">
          {isScheduling && (
            <input
              type="datetime-local"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="absolute w-full bottom-full left-0 border border-[#ECECED] p-2 mb-1 rounded shadow-lg"
            />
          )}
          <Button
            variant="secondary"
            onClick={() => {
              if (isScheduling && scheduleTime) {
                handlePost(true);
              } else {
                setIsScheduling(!isScheduling);
              }
            }}
            size="small"
            disabled={isLoading}
          >
            <Calendar size={16} />
            {isScheduling ? "Schedule Post" : "Schedule"}
          </Button>
          <Button
            onClick={() => handlePost(false)}
            size="small"
            disabled={isLoading}
          >
            {requireApproval ? "Submit for Approval" : "Publish"}
            <SendHorizonal size={16} />
          </Button>
        </div>
      </div>

      <MediaLibraryModal
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={handleMediaLibrarySelect}
        selectedMedia={selectedMedia}
      />

      <AIModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onInsert={handleAITextInsert}
      />
    </div>
  );
}

export default function LexicalEditor(props: LexicalEditorProps) {
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <EditorContent {...props} />
    </LexicalComposer>
  );
}
