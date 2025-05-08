import { Suspense } from "react";
import InvitationForm from "./InvitationForm";

export default async function Invitation({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const token = await params;
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="border-t-4 border-[#444CE7] rounded-full w-16 h-16 animate-spin mb-3"></div>
          <div className="text-[#101828]">Loading...</div>
        </div>
      }
    >
      <InvitationForm params={token} />
    </Suspense>
  );
}
