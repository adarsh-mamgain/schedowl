"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Button from "@/src/components/Button";
import { useState, useEffect } from "react";
import { ProfileSchema } from "@/src/schema";
import Image from "next/image";
import axios from "axios";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type ProfileFormValues = z.infer<typeof ProfileSchema>;

export default function ProfilePage() {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileSchema),
  });

  const name = watch("name");
  const email = watch("email");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get("/api/user");
        const userData = response.data;
        setValue("name", userData.name || "");
        setValue("email", userData.email || "");
        setPhotoPreview(userData.image || null);
      } catch (error) {
        toast.error("Failed to load profile data");
      }
    };

    if (status === "authenticated") {
      fetchUserProfile();
    }
  }, [status, setValue]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const updateData = {
        ...data,
        image: photoPreview,
      };

      await axios.put("/api/user", updateData);
      toast.success("Profile updated successfully");
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-[#101828] text-sm font-semibold">
                Personal info
              </h2>
            </div>
            <p className="text-sm text-[#475467]">
              Update your photo and personal details here.
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
                <Button type="submit" size="small" disabled={isSubmitting}>
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
          {/* Name Fields */}
          <div className="text-sm grid grid-cols-12 gap-4 pt-5 pb-4 border-t border-t-[#E4E7EC]">
            <div className="col-span-3">
              <label htmlFor="name" className="text-[#344054] font-medium">
                Name
              </label>
            </div>
            <div className="col-span-6">
              <input
                type="text"
                {...register("name")}
                disabled={!isEditing}
                className="w-full text-[#101828] px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D] disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>
          </div>

          {/* Email Field */}
          <div className="text-sm grid grid-cols-12 gap-4 pt-5 pb-4 border-t border-t-[#E4E7EC]">
            <div className="col-span-3">
              <label htmlFor="email" className="text-[#344054] font-medium">
                Email address
              </label>
            </div>
            <div className="col-span-6">
              <input
                type="email"
                {...register("email")}
                disabled={!isEditing}
                className="w-full text-[#101828] px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D] disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          {/* Password Field */}
          <div className="text-sm grid grid-cols-12 gap-4 pt-5 pb-4 border-t border-t-[#E4E7EC]">
            <div className="col-span-3">
              <label htmlFor="password" className="text-[#344054] font-medium">
                New password
              </label>
            </div>
            <div className="col-span-6">
              <input
                type="password"
                {...register("password")}
                disabled={!isEditing}
                className="w-full text-[#101828] px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D] disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          {/* Photo Upload */}
          <div className="text-sm grid grid-cols-12 gap-4 pt-5 pb-4 border-t border-t-[#E4E7EC]">
            <div className="col-span-3">
              <label className="text-[#344054] font-medium">
                Your photo
                <span className="block text-[#475467] font-normal">
                  This will be displayed on your profile.
                </span>
              </label>
            </div>
            <div className="col-span-6 flex items-center gap-4">
              <label
                htmlFor="photo-upload"
                className={`w-16 h-16 bg-gray-200 rounded-full overflow-hidden ${
                  isEditing
                    ? "cursor-pointer transition-transform duration-200 hover:scale-105 hover:opacity-80"
                    : "cursor-not-allowed"
                }`}
              >
                <Image
                  src={photoPreview || "/user.png"}
                  width={64}
                  height={64}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                disabled={!isEditing}
                className="hidden"
                id="photo-upload"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
