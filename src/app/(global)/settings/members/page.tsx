"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { z } from "zod";
import { Pencil, Trash2, UserPlus, X } from "lucide-react";
import axios from "axios";
import Button from "@/src/components/Button";
import { toast } from "react-toastify";

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
  userId: string;
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

export default function MembersPage() {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const getMembers = async () => {
      try {
        const result = await axios.get("/api/members");
        setMembers(result.data);
      } catch {
        toast.error("Error fetching members");
      }
    };

    getMembers();
  }, []);

  const inviteMember: SubmitHandler<FormValues> = async (data) => {
    try {
      await axios.post("/api/members", data);
      toast.success("Member invited successfully!");
      reset();
      setShowInviteForm(false);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Failed to invite member");
      } else {
        toast.error("An unexpected error occurred.");
      }
    }
  };

  const columns: ColumnDef<Member>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-medium text-[#101828]">
              {row.original.user.name}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email address",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-medium text-[#101828]">
              {row.original.user.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <div className="flex">
          <div className="flex items-center gap-1 border border-[#D0D5DD] text-xs font-medium px-1.5 py-0.5 rounded-md shadow-[0px_1px_2px_0px_#1018280D]">
            <span
              className={`w-2 h-2 rounded-full ${
                MemberColors[row.original.role]
              }`}
            ></span>
            <span>{row.original.role}</span>
          </div>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: () => (
        <div className="flex items-center gap-5">
          <button className="text-gray-500 text-[#475467] hover:text-blue-600">
            <Pencil size={16} />
          </button>
          <button className="text-[#475467] hover:text-red-700">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: members,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[#101828] text-sm font-semibold">
              Team Members
            </h2>
            <span className="bg-white text-[#344054] text-xs font-medium rounded px-1.5 py-0.5 border">
              {members.length}
            </span>
          </div>
          <p className="text-sm text-[#475467]">
            Manage your team members and their account permissions here.
          </p>
        </div>
        <div>
          <Button
            size="small"
            onClick={() => setShowInviteForm((prev) => !prev)}
          >
            Add user
          </Button>
        </div>
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
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
                  className="text-[#667085 px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D]"
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
                  className="text-[#667085 px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D]"
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
