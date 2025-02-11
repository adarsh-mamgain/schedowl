"use client";

import Image from "next/image";

export default function IntegrationsPage() {
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
      <div className="col-span-9 flex flex-col gap-3">
        <div className="flex items-center gap-3  border border-[#EAECF0] rounded-[16px] p-4 text-sm">
          <div className="w-10 h-10 flex items-center justify-center border border-[#EAECF0] rounded shadow">
            <Image src="/linkedin.svg" alt="linkedin" width={40} height={40} />
          </div>
          <div>
            <h3 className="text-[#101828] font-semibold">LinkedIn</h3>
            <p className="text-[#475467]">
              LinkedIn is a business and employment-focused online professional
              platform that works through websites and mobile apps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
