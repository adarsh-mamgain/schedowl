"use client";

import React, { useState } from "react";
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
} from "lexical";
import { INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list";
import { Bold, Calendar, Italic, List, SendHorizonal } from "lucide-react";
import Button from "@/src/components/Button";
import { toast } from "react-toastify";
import axios from "axios";

const EMOJI_CATEGORIES = {
  Smileys: ["😀", "😍", "🤔", "😂", "🥲"],
  Objects: ["🚀", "💡", "📱", "💻", "🎉"],
  Symbols: ["❤️", "✨", "🔥", "👍", "🌟"],
};

function UnicodeToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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

  const insertEmoji = (emoji: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if (selection) {
        selection.insertText(emoji);
        setShowEmojiPicker(false);
      }
    });
  };

  return (
    <div className="flex items-center space-x-1 p-1 border-y border-y-[#EAECF0] rounded-t-lg">
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        className={`p-2 hover:bg-gray-200 bg-gray-100 rounded ${
          isBold ? "text-blue-500" : "text-[#98A2B3]"
        }`}
      >
        <Bold size={16} strokeWidth={4} />
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        className={`p-2 hover:bg-gray-200 bg-gray-100 rounded ${
          isItalic ? "text-blue-500" : "text-[#98A2B3]"
        }`}
      >
        <Italic size={16} strokeWidth={4} />
      </button>
      <button
        onClick={() =>
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
        }
        className="text-[#98A2B3] p-2 hover:bg-gray-200 bg-gray-100 rounded"
      >
        <List size={16} strokeWidth={4} />
      </button>
      <div className="relative">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="text-xs text-[#98A2B3] p-2 hover:bg-gray-200 bg-gray-100 rounded"
        >
          😀
        </button>
        {showEmojiPicker && (
          <div className="absolute z-10 bg-white border rounded shadow-lg p-2">
            {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
              <div key={category} className="mb-2">
                <div className="text-xs text-gray-500">{category}</div>
                <div className="flex space-x-1">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => insertEmoji(emoji)}
                      className="text-xl"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
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
    },
  },
  onError: console.error,
};

export default function LexicalEditor({
  onChange,
}: {
  onChange: (text: string) => void;
}) {
  const [postContent, setPostContent] = useState("");
  const [scheduleTime] = useState("");
  // const [isScheduling, setIsScheduling] = useState(false);

  const handlePost = async () => {
    try {
      if (!postContent.trim()) {
        toast.error("Post content cannot be empty");
        return;
      }

      const payload = scheduleTime
        ? { text: postContent, scheduleTime }
        : { text: postContent };

      await axios.post("/api/integrations/linkedin/post", payload);
      toast.success("Post scheduled successfully!");
    } catch {
      toast.error("Failed to schedule/post");
    }
  };

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="border-x border-x-[#EAECF0] rounded-l-lg rounded-r-lg">
        <UnicodeToolbarPlugin />
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="outline-none border-none p-4 min-h-[150px]"
              aria-label="Post content"
              onInput={(e) => {
                const text = (e.target as HTMLDivElement).innerText;
                setPostContent(text);
                onChange(text); // Pass text to parent
              }}
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <AutoFocusPlugin />
        <div className="flex items-center p-2 border-t border-t-[#EAECF0] text-sm">
          Account:
        </div>
        <div className="flex items-center justify-between p-2 border-y border-y-[#EAECF0] rounded-b-lg">
          {/* {isScheduling && (
            <input
              type="datetime-local"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="border p-2 rounded w-full"
            />
          )} */}
          <div>
            <Button variant="secondary" size="small">
              Save draft
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handlePost} size="small">
              <Calendar size={16} />
              Schedule
            </Button>
            <Button
              // onClick={() => setIsScheduling((prev) => !prev)}
              size="small"
            >
              Publish <SendHorizonal size={16} />
            </Button>
          </div>
        </div>
      </div>
    </LexicalComposer>
  );
}
