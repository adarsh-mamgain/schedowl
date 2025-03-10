"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { z } from "zod";
import { Trash2, UserPlus, X, SendHorizonal } from "lucide-react";
import axios from "axios";
import Button from "@/src/components/Button";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import { hasPermission } from "@/src/lib/permissions";

const roles = ["MEMBER", "ADMIN"] as const;

const schema = z.object({
  email: z.string().email("Invalid email"),
  role: z.enum(roles),
});

type FormValues = z.infer<typeof schema>;

const MemberColors = {
  OWNER: "bg-amber-500",
  ADMIN: "bg-green-500",
  MEMBER: "bg-gray-400",
} as const;

interface Member {
  id: string;
  role: keyof typeof MemberColors;
  createdAt: string;
  updatedAt: string;
  organisationId: string;
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: keyof typeof MemberColors;
  createdAt: string;
  expiresAt: string;
}

export default function MembersPage() {
  const { data: session } = useSession();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const getMembers = async () => {
      try {
        const result = await axios.get("/api/members");
        setMembers(result.data.members);
        setInvitations(result.data.invitations);
      } catch {
        toast.error("Error fetching members");
      }
    };

    getMembers();
  }, []);

  const inviteMember: SubmitHandler<FormValues> = async (data) => {
    try {
      await axios.post(`/api/organisations/invite`, data);
      toast.success("Member invited successfully!");
      setShowInviteForm(false);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Failed to invite member");
      } else {
        toast.error("An unexpected error occurred.");
      }
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await axios.delete(`/api/members/${memberId}`);
      toast.success("Member removed successfully!");
      setMembers(members.filter((m) => m.id !== memberId));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Failed to remove member");
      } else {
        toast.error("An unexpected error occurred.");
      }
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: Role) => {
    try {
      await axios.put(`/api/members/${memberId}`, { role: newRole });
      toast.success("Member role updated successfully!");
      setMembers(
        members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Failed to update role");
      } else {
        toast.error("An unexpected error occurred.");
      }
    }
  };

  const handleRemoveInvitation = async (invitationId: string) => {
    try {
      await axios.delete(`/api/invitations/${invitationId}`);
      toast.success("Invitation removed successfully!");
      setInvitations(invitations.filter((i) => i.id !== invitationId));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.error || "Failed to remove invitation"
        );
      } else {
        toast.error("An unexpected error occurred.");
      }
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      await axios.post(`/api/invitations/${invitationId}/resend`);
      toast.success("Invitation resent successfully!");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.error || "Failed to resend invitation"
        );
      } else {
        toast.error("An unexpected error occurred.");
      }
    }
  };

  const columns = useMemo<ColumnDef<Member | Invitation>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
          const data = row.original;
          if ("user" in data) {
            // It's a Member
            return (
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-medium text-[#101828]">
                    {data.user.name}
                  </p>
                </div>
              </div>
            );
          } else {
            // It's an Invitation
            return (
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-medium text-[#101828]">
                    Pending Invitation
                  </p>
                </div>
              </div>
            );
          }
        },
      },
      {
        accessorKey: "email",
        header: "Email address",
        cell: ({ row }) => {
          const data = row.original;
          const email = "user" in data ? data.user.email : data.email;
          return (
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-medium text-[#101828]">{email}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
          const data = row.original;
          const role = "user" in data ? data.role : data.role;
          return (
            <div className="flex">
              <div className="flex items-center gap-1 border border-[#D0D5DD] text-xs font-medium px-1.5 py-0.5 rounded-md shadow-[0px_1px_2px_0px_#1018280D]">
                <span
                  className={`w-2 h-2 rounded-full ${MemberColors[role]}`}
                ></span>
                <span>{role}</span>
                {"expiresAt" in data && <span className="ml-1">(Pending)</span>}
              </div>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const data = row.original;
          const currentUserRole = session?.organisationRole?.role as Role;
          const canManageUsers = hasPermission(currentUserRole, "manage_users");
          const canAssignUsers = hasPermission(currentUserRole, "assign_users");

          if (!canManageUsers && !canAssignUsers) {
            return null;
          }

          if ("user" in data) {
            // It's a Member
            const isOwner = data.role === "OWNER";
            const isCurrentUser = data.user.id === session?.user?.id;

            if (isOwner || isCurrentUser) {
              return null; // Don't show actions for owner or current user
            }

            return (
              <div className="flex items-center gap-5">
                {canAssignUsers && (
                  <select
                    value={data.role}
                    onChange={(e) =>
                      handleUpdateRole(data.id, e.target.value as Role)
                    }
                    className="text-sm border rounded px-2 py-1"
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                )}
                {canManageUsers && (
                  <button
                    className="text-[#475467] hover:text-red-700"
                    onClick={() => handleRemoveMember(data.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          } else {
            // It's an Invitation
            return (
              <div className="flex items-center gap-5">
                {canManageUsers && (
                  <>
                    <button
                      className="text-[#475467] hover:text-blue-700"
                      onClick={() => handleResendInvitation(data.id)}
                    >
                      <SendHorizonal size={16} />
                    </button>
                    <button
                      className="text-[#475467] hover:text-red-700"
                      onClick={() => handleRemoveInvitation(data.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            );
          }
        },
      },
    ],
    [session?.organisationRole?.role, session?.user?.id]
  );

  const table = useReactTable({
    data: useMemo(() => [...members, ...invitations], [members, invitations]),
    columns: useMemo(() => columns, [columns]),
    getCoreRowModel: getCoreRowModel(),
  });

  const canManageUsers = hasPermission(
    session?.organisationRole?.role as Role,
    "manage_users"
  );
  const canAssignUsers = hasPermission(
    session?.organisationRole?.role as Role,
    "assign_users"
  );

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[#101828] text-sm font-semibold">
              Team Members
            </h2>
            <span className="bg-white text-[#344054] text-xs font-medium rounded px-1.5 py-0.5 border">
              {members.length + invitations.length}
            </span>
          </div>
          <p className="text-sm text-[#475467]">
            Manage your team members and their account permissions here.
          </p>
        </div>
        {(canManageUsers || canAssignUsers) && (
          <div>
            <Button size="small" onClick={() => setShowInviteForm(true)}>
              Add user
            </Button>
          </div>
        )}
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
            <button
              className="absolute top-4 right-4 rounded-full bg-gray-100 hover:bg-gray-200 p-2"
              onClick={() => setShowInviteForm(false)}
            >
              <X size={16} />
            </button>
            <h3 className="text-lg font-semibold mb-4">Invite Member</h3>
            <form
              onSubmit={handleSubmit(inviteMember)}
              className="flex flex-col gap-4 text-sm"
            >
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-[#344054] font-medium">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter email"
                  {...register("email")}
                  className="text-[#667085] px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D]"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs">
                    {errors.email.message as string}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="role" className="text-[#344054] font-medium">
                  Role
                </label>
                <select
                  {...register("role")}
                  className="text-[#667085] px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D]"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" size="small">
                <UserPlus size={16} className="inline" /> Invite
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Members Table */}
      <div className="bg-white border border-[#E4E7EC] rounded-lg shadow-[0px_1px_2px_0px_#1018280D]">
        <table className="w-full text-sm text-left">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-b-[#E4E7EC] text-xs"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 font-medium text-[#475467]"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-b-[#E4E7EC] hover:bg-gray-50"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-3 text-[#344054]">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
