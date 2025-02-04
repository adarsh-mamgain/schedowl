"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { z } from "zod";
import { Trash2, UserPlus } from "lucide-react";

const roles = ["OWNER", "ADMIN", "MEMBER"] as const;

const schema = z.object({
  email: z.string().email("Invalid email"),
  role: z.enum(roles),
});

type Member = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  isOwner: boolean;
};

const mockMembers: Member[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "ADMIN",
    isOwner: false,
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "MEMBER",
    isOwner: false,
  },
  {
    id: "3",
    name: "Alice Johnson",
    email: "alice@example.com",
    role: "OWNER",
    isOwner: true,
  },
];

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const inviteMember = (data: z.infer<typeof schema>) => {
    setMembers([
      ...members,
      {
        id: crypto.randomUUID(),
        name: data.email.split("@")[0],
        ...data,
        isOwner: false,
      },
    ]);
    reset();
  };

  const updateRole = (id: string, newRole: "OWNER" | "ADMIN" | "MEMBER") => {
    setMembers(members.map((m) => (m.id === id ? { ...m, role: newRole } : m)));
  };

  const deleteMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  const columns: ColumnDef<Member>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <select
          className="border p-1 rounded text-sm"
          value={row.original.role}
          onChange={(e) =>
            updateRole(
              row.original.id,
              e.target.value as "OWNER" | "ADMIN" | "MEMBER"
            )
          }
          disabled={row.original.isOwner}
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) =>
        row.original.isOwner ? (
          <span className="text-gray-400 text-sm">Owner</span>
        ) : (
          <button
            onClick={() => deleteMember(row.original.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 size={16} />
          </button>
        ),
    },
  ];

  const table = useReactTable({
    data: members,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Manage Members</h2>

      {/* Invite Form */}
      <form
        onSubmit={handleSubmit(inviteMember)}
        className="flex items-center gap-2 mb-6"
      >
        <input
          type="email"
          placeholder="Enter email"
          {...register("email")}
          className="border rounded p-2 flex-1 text-sm"
        />
        <select {...register("role")} className="border rounded p-2 text-sm">
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          <UserPlus size={16} />
        </button>
      </form>
      {errors.email && (
        <p className="text-red-500 text-xs">{errors.email.message}</p>
      )}

      {/* Members Table */}
      <table className="w-full border-collapse">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="text-left p-2 text-sm font-semibold"
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
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-2 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center text-gray-500 p-4 text-sm"
              >
                No members found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
