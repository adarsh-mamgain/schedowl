import { Monitor, Tablet } from "lucide-react";
import LexicalEditor from "@/src/components/LexicalEditor";

export default function PostForm() {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-7">
        <LexicalEditor />
      </div>

      <div className="col-span-5 border border-[#EAECF0] rounded-lg">
        <div className="flex justify-end p-1 border-b border-[#EAECF0]">
          <button className="p-2">
            <Tablet size={16} color="#475467" />
          </button>
          <button className="p-2">
            <Monitor size={16} color="#475467" />
          </button>
        </div>

        <div className="bg-[#FCFCFD] p-4">
          <div className="flex flex-col bg-white p-6 shadow-[0px_2px_4px_-3px_#1018280D,0px_4px_8px_-2px_#1018280D] rounded-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-red-500 rounded-full"></div>
              <div className="flex flex-col">
                <span className="font-semibold text-[#101828]">John Doe</span>
                <span className="text-sm text-[#667085]">Now </span>
              </div>
            </div>
            <div className="mb-6">
              Lorem Ipsum is simply dummy text of the printing and typesetting
              industry. Lorem Ipsum has been the industry&apos;s standard dummy
              text ever since the 1500s, when an unknown printer took a galley
              of type and scrambled it
            </div>
            <div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
