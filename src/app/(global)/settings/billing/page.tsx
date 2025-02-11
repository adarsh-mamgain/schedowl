"use client";

import { Zap } from "lucide-react";

export default function BillinPage() {
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
      {/* <div className="bg-white border border-[#E4E7EC] rounded-lg shadow-[0px_1px_2px_0px_#1018280D]">
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
      </div> */}
    </div>
  );
}
