"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { z } from "zod";
import { Pencil, Trash2, Zap } from "lucide-react";
import axios from "axios";
import Button from "@/src/components/Button";
import Image from "next/image";

const roles = ["OWNER", "ADMIN", "MEMBER"] as const;

const schema = z.object({
  email: z.string().email("Invalid email"),
  role: z.enum(roles),
});

const mockMembers = [
  {
    id: "1",
    name: "Olivia Rhye",
    username: "@olivia",
    email: "olivia@untitledui.com",
    status: "Active",
    role: "Admin",
    avatar: "/avatars/olivia.jpg",
  },
  {
    id: "2",
    name: "Phoenix Baker",
    username: "@phoenix",
    email: "phoenix@untitledui.com",
    status: "Active",
    role: "Member",
    avatar: "/avatars/phoenix.jpg",
  },
  {
    id: "3",
    name: "Lana Steiner",
    username: "@lana",
    email: "lana@untitledui.com",
    status: "Offline",
    role: "Member",
    avatar: "/avatars/lana.jpg",
  },
];

const statusColors = {
  Active: "bg-green-500",
  Offline: "bg-gray-400",
};

const MemberColors = {
  Admin: "bg-red-500",
  Member: "bg-gray-400",
};

export default function BillinPage() {
  const [members, setMembers] = useState(mockMembers);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const getMembers = async () => {
      const result = await axios.get("/api/members");
      console.log("result", result.data);
    };

    getMembers();
  }, []);

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

  const columns: ColumnDef<(typeof members)[number]>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Image
            src="/globe.svg"
            alt={row.original.name}
            width={32}
            height={32}
            className="rounded-full"
          />
          <div>
            <p className="text-sm font-medium text-[#101828]">
              {row.original.name}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email address",
    },
    // {
    //   accessorKey: "status",
    //   header: "Status",
    //   cell: ({ row }) => (
    //     <div className="flex">
    //       <div className="flex items-center gap-1 border border-[#D0D5DD] text-xs font-medium px-1.5 py-0.5 rounded-md shadow-[0px_1px_2px_0px_#1018280D]">
    //         <span
    //           className={`w-[8px] h-[8px] rounded-full ${
    //             statusColors[row.original.status]
    //           }`}
    //         ></span>
    //         <span>{row.original.status}</span>
    //       </div>
    //     </div>
    //   ),
    // },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <div className="flex">
          <div className="flex items-center gap-1 border border-[#D0D5DD] text-xs font-medium px-1.5 py-0.5 rounded-md shadow-[0px_1px_2px_0px_#1018280D]">
            <span
              className={`w-[8px] h-[8px] rounded-full ${
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
      cell: ({ row }) => (
        <div className="flex items-center gap-5">
          <button className="text-gray-500 text-[#475467] hover:text-blue-600">
            <Pencil size={16} />
          </button>
          <button
            onClick={() =>
              setData(data.filter((m) => m.id !== row.original.id))
            }
            className="text-[#475467] hover:text-red-700"
          >
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[#101828] text-sm font-semibold">
              Account plans
            </h2>
          </div>
          <p className="text-sm text-[#475467]">
            Pick an account plan that fits your workflow.
          </p>
        </div>
        {/* <div>
          <Button size="small">Add user</Button>
        </div> */}
      </div>

      <hr color="#E4E7EC" />

      <div className="grid grid-cols-12 content-start gap-20 items-center mb-6">
        <div className="col-span-3">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[#101828] text-sm font-semibold">
              Current plan
            </h2>
          </div>
          <p className="text-sm text-[#475467]">
            We&apos;ll credit your account if you need to downgrade during the
            billing cycle.
          </p>
        </div>
        <div className="col-span-9 flex flex-col gap-3">
          <div className="flex items-center gap-3  border border-[#EAECF0] rounded-[16px] p-4 text-sm">
            <div className="w-10 h-10 flex items-center justify-center border border-[#EAECF0] rounded shadow">
              <Zap size={16} color={"#344054"} />
            </div>
            <div>
              <h3 className="text-[#101828] font-semibold">Basic plan</h3>
              <p className="text-[#475467]">
                Includes up to 10 users, 20GB individual data and access to all
                features.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3  border border-[#EAECF0] rounded-[16px] p-4 text-sm">
            <div className="w-10 h-10 flex items-center justify-center border border-[#EAECF0] rounded shadow">
              <Zap size={16} color={"#344054"} />
            </div>
            <div>
              <h3 className="text-[#101828] font-semibold">Business plan</h3>
              <p className="text-[#475467]">
                Includes up to 10 users, 20GB individual data and access to all
                features.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3  border border-[#EAECF0] rounded-[16px] p-4 text-sm">
            <div className="w-10 h-10 flex items-center justify-center border border-[#EAECF0] rounded shadow">
              <Zap size={16} color={"#344054"} />
            </div>
            <div>
              <h3 className="text-[#101828] font-semibold">Enterprise plan</h3>
              <p className="text-[#475467]">
                Includes up to 10 users, 20GB individual data and access to all
                features.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Form
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
      )} */}

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
