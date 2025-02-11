"use client";

import { Monitor, Tablet } from "lucide-react";
import LexicalEditor from "@/src/components/LexicalEditor";

export default function PostForm() {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-7">
        <LexicalEditor />
      </div>
      <div className="bg-[#FCFCFD] col-span-5 border border-[#EAECF0] rounded-lg">
        <div className="bg-white flex justify-end p-1 border-b border-[#EAECF0] rounded-t-lg">
          <button className="p-2">
            <Tablet size={16} color="#475467" />
          </button>
          <button className="p-2">
            <Monitor size={16} color="#475467" />
          </button>
        </div>
        <div className="p-4">
          <div className="flex flex-col bg-white p-6 shadow rounded-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              <div className="flex flex-col">
                <span className="font-semibold text-[#101828]">John Doe</span>
                <span className="text-sm text-[#667085]">Now </span>
              </div>
            </div>
            <div className="mb-6 text-[#475467]">Write something...</div>
          </div>
        </div>
      </div>
    </div>
  );
}
