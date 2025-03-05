"use client";

import Button from "@/src/components/Button";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";

export default function OrganisationSettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [orgName, setOrgName] = useState(session?.organisation?.name || "");
  const [isEditing, setIsEditing] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (session?.organisation?.image) {
      setPhotoPreview(session.organisation.image);
    }
  }, [session?.organisation?.image]);

  const handleOrgImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/organisation/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload organisation image");
      }

      const data = await response.json();
      await updateSession({
        organisation: { ...session?.organisation, image: data.url },
      });
      setPhotoPreview(data.url);
      toast.success("Organisation image updated successfully");
    } catch (error) {
      console.error("Error uploading organisation image:", error);
      toast.error("Failed to upload organisation image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      toast.error("Organisation name cannot be empty");
      return;
    }

    try {
      const response = await axios.put("/api/organisation/update", {
        name: orgName.trim(),
      });

      if (response.status === 200) {
        await updateSession({
          organisation: { ...session?.organisation, name: orgName.trim() },
        });
        toast.success("Organisation updated successfully");
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating organisation:", error);
      toast.error("Failed to update organisation");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setOrgName(session?.organisation?.name || "");
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-[#101828] text-sm font-semibold">
                Organisation info
              </h2>
            </div>
            <p className="text-sm text-[#475467]">
              Update your organisation's details and branding.
            </p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  type="button"
                  size="small"
                  variant="secondary"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button type="submit" size="small" disabled={isUploading}>
                  Save
                </Button>
              </>
            ) : (
              <Button
                type="button"
                size="small"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Organisation Name Field */}
          <div className="text-sm grid grid-cols-12 gap-4 pt-5 pb-4 border-t border-t-[#E4E7EC]">
            <div className="col-span-3">
              <label htmlFor="orgName" className="text-[#344054] font-medium">
                Organisation Name
              </label>
            </div>
            <div className="col-span-6">
              <input
                type="text"
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                disabled={!isEditing}
                className="w-full text-[#101828] px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D] disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter organisation name"
              />
            </div>
          </div>

          {/* Logo Upload */}
          <div className="text-sm grid grid-cols-12 gap-4 pt-5 pb-4 border-t border-t-[#E4E7EC]">
            <div className="col-span-3">
              <label className="text-[#344054] font-medium">
                Organisation logo
                <span className="block text-[#475467] font-normal">
                  This will be displayed in the navigation and other places.
                </span>
              </label>
            </div>
            <div className="col-span-6 flex items-center gap-4">
              <label
                htmlFor="logo-upload"
                className={`w-16 h-16 bg-gray-200 rounded-lg overflow-hidden ${
                  isEditing
                    ? "cursor-pointer transition-transform duration-200 hover:scale-105 hover:opacity-80"
                    : "cursor-not-allowed"
                }`}
              >
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoPreview}
                    alt={session?.organisation?.name || "Organisation logo"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                    {session?.organisation?.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleOrgImageUpload}
                disabled={!isEditing}
                className="hidden"
                id="logo-upload"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
