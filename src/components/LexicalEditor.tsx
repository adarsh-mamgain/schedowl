"use client";

import React, { useEffect, useRef, useState } from "react";
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
} from "lexical";
import { INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list";
import {
  Bold,
  Calendar,
  Check,
  Italic,
  List,
  Plus,
  SendHorizonal,
  X,
} from "lucide-react";
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
        className={`p-2 hover:bg-gray-200 rounded ${
          isBold ? "text-blue-500" : "text-[#98A2B3]"
        }`}
      >
        <Bold size={16} strokeWidth={4} />
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        className={`p-2 hover:bg-gray-200 rounded ${
          isItalic ? "text-blue-500" : "text-[#98A2B3]"
        }`}
      >
        <Italic size={16} strokeWidth={4} />
      </button>
      <button
        onClick={() =>
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
        }
        className="text-[#98A2B3] p-2 hover:bg-gray-200 rounded"
      >
        <List size={16} strokeWidth={4} />
      </button>
      <div className="relative">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="text-xs text-[#98A2B3] p-2 hover:bg-gray-200 rounded"
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
  givenName: string;
  familyName: string;
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    `${account.givenName} ${account.familyName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
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
                <span>
                  {account.givenName} {account.familyName}
                </span>
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
        <div className="absolute bottom-full left-0 mb-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <span className="text-gray-900">
                      {account.givenName} {account.familyName}
                    </span>
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
  accounts = [],
  selectedAccounts = [],
  onAccountsChange,
  onChange,
  onPost,
}: {
  accounts: LinkedInAccount[];
  selectedAccounts: string[];
  onAccountsChange: (ids: string[]) => void;
  onChange: (text: string) => void;
  onPost: (isScheduled: boolean, scheduleTime?: string) => Promise<void>;
}) {
  const [postContent, setPostContent] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  useEffect(() => {
    onChange(postContent);
  }, [postContent, onChange]);

  const handleDraftSave = async () => {
    try {
      await axios.post("/api/posts/drafts", {
        content: postContent,
        linkedInAccountIds: selectedAccounts,
      });
      toast.success("Draft saved successfully!");
    } catch {
      toast.error("Failed to save draft");
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // Set minimum time to 5 minutes from now
    return now.toISOString().slice(0, 16); // Format as YYYY-MM-DDThh:mm
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
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <OnChangePlugin onChange={setPostContent} />
        <HistoryPlugin />
        <AutoFocusPlugin />
        <div className="flex items-center p-2 border-t border-t-[#EAECF0] text-sm">
          <InlineAccountSelect
            accounts={accounts}
            selectedAccounts={selectedAccounts}
            onChange={onAccountsChange}
          />
        </div>
        <div className="flex items-center justify-between p-2 border-y border-y-[#EAECF0] rounded-b-lg">
          <div>
            <Button variant="secondary" size="small" onClick={handleDraftSave}>
              Save draft
            </Button>
          </div>
          <div className="relative flex gap-2">
            {isScheduling && (
              <input
                type="datetime-local"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                min={getMinDateTime()}
                className="absolute w-full bottom-full left-0 border p-2 mb-1 rounded shadow-lg"
              />
            )}
            <Button
              variant="secondary"
              onClick={() => {
                if (isScheduling && scheduleTime) {
                  onPost(true, scheduleTime);
                  setIsScheduling(false);
                  setScheduleTime("");
                } else {
                  setIsScheduling(!isScheduling);
                }
              }}
              size="small"
            >
              <Calendar size={16} />
              {isScheduling ? "Schedule Post" : "Schedule"}
            </Button>
            <Button onClick={() => onPost(false)} size="small">
              Publish <SendHorizonal size={16} />
            </Button>
          </div>
        </div>
      </div>
    </LexicalComposer>
  );
}
