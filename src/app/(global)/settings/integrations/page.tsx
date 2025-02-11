"use client";

import Button from "@/src/components/Button";
import axios from "axios";
import { Plus } from "lucide-react";
import Image from "next/image";

export default function IntegrationsPage() {
  const addLinkedInIntegration = async () => {
    try {
      const response = await axios.get("/api/integrations/linkedin");
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Failed to connect LinkedIn:", error);
    }
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[#101828] text-sm font-semibold">
              Connected apps
            </h2>
          </div>
          <p className="text-sm text-[#475467]">
            Supercharge your workflow and connect the tool you use every day.
          </p>
        </div>
      </div>

      {/* Integrations Table */}
      <div className="grid grid-cols-2 gap-6">
        <div className="flex items-center justify-between border border-[#EAECF0] rounded-lg p-4">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-10 h-10 flex items-center justify-center p-1 border border-[#EAECF0] rounded shadow-[0px_1px_2px_0px_#1018280D]">
              <Image
                src="/linkedin.svg"
                alt="linkedin"
                width={40}
                height={40}
              />
            </div>
            <div>
              <h3 className="text-[#101828] font-semibold">LinkedIn</h3>
              <p className="text-[#475467]">
                A business and employment-focused online professional platform.
              </p>
            </div>
          </div>
          <div className="grow-1">
            <Button size="small" onClick={addLinkedInIntegration}>
              <Plus size={20} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
