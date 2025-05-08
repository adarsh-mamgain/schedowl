"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Post } from "@prisma/client";
import { format } from "date-fns";
import { Pencil, Trash2, Clock } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import Link from "next/link";

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
}

export default function ScheduledPostsPage() {
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(
          "/api/posts/by-status?status=SCHEDULED"
        );
        setPosts(response.data.posts);
      } catch {
        toast.error("Failed to fetch scheduled posts");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleCancelPost = async (postId: string) => {
    try {
      await axios.post(`/api/posts/${postId}/cancel`);
      setPosts(posts.filter((post) => post.id !== postId));
      toast.success("Post cancelled successfully");
    } catch (error) {
      toast.error("Failed to cancel post");
    }
  };

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
        accessorKey: "scheduledFor",
        header: "Scheduled For",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-500" />
            <span>
              {format(
                new Date(row.original.scheduledFor),
                "MMM d, yyyy h:mm a"
              )}
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
              <img
                src={row.original.createdBy.image}
                alt={row.original.createdBy.name}
                className="w-6 h-6 rounded-full"
              />
            )}
            <span>{row.original.createdBy.name}</span>
          </div>
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
              onClick={() => handleCancelPost(row.original.id)}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ],
    [handleCancelPost]
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
