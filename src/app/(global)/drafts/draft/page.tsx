"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Post } from "@prisma/client";
import dayjs from "dayjs";
import { Pencil, Trash2 } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import Link from "next/link";
import Image from "next/image";

interface PostWithRelations extends Post {
  socialAccount: {
    name: string;
    type: string;
  };
  createdBy: {
    name: string;
    image: string | null;
  };
  media: {
    media: {
      url: string;
      type: string;
    };
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export default function DraftPostsPage() {
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get("/api/posts/by-status?status=DRAFT");
        setPosts(response.data.posts);
      } catch {
        toast.error("Failed to fetch draft posts");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleDeletePost = useCallback(
    async (postId: string) => {
      try {
        await axios.delete(`/api/posts/${postId}`);
        setPosts(posts.filter((post) => post.id !== postId));
        toast.success("Post deleted successfully");
      } catch {
        toast.error("Failed to delete post");
      }
    },
    [posts]
  );

  const columns = useMemo<ColumnDef<PostWithRelations>[]>(
    () => [
      {
        accessorKey: "content",
        header: "Content",
        cell: ({ row }) => (
          <div className="max-w-md truncate">{row.original.content}</div>
        ),
      },
      {
        accessorKey: "socialAccount",
        header: "Platform",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span>{row.original.socialAccount.name}</span>
            <span className="text-gray-500">
              ({row.original.socialAccount.type})
            </span>
          </div>
        ),
      },
      {
        accessorKey: "createdBy",
        header: "Created By",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.createdBy.image && (
              <Image
                src={row.original.createdBy.image}
                alt={row.original.createdBy.name}
                width={24}
                height={24}
                className="rounded-full"
              />
            )}
            <span>{row.original.createdBy.name}</span>
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => (
          <div>{dayjs(row.original.createdAt).format("MMM D, YYYY")}</div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-4">
            <Link
              href={`/drafts/edit/${row.original.id}`}
              className="text-blue-600 hover:text-blue-800"
            >
              <Pencil size={16} />
            </Link>
            <button
              onClick={() => handleDeletePost(row.original.id)}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ],
    [handleDeletePost]
  );

  const table = useReactTable({
    data: posts,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
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
  );
}
