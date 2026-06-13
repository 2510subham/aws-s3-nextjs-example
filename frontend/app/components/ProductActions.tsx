"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  id: string;
  apiBase: string;
};

export default function ProductActions({ id, apiBase }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`${apiBase}/products/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Delete failed (${res.status})`);
      }
      // redirect back to product list
      router.push("/");
    } catch (err: any) {
      alert(err?.message ?? "Failed to delete product");
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/?highlight=${id}`}
        className="text-sm text-gray-600 hover:underline"
      >
        Back
      </Link>
      {/* <Link
        href={`/create?edit=${id}`}
        className="bg-yellow-400 text-black px-3 py-1 rounded-md text-sm hover:bg-yellow-500"
      >
        Edit
      </Link>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className={`px-3 py-1 rounded-md text-sm ${deleting ? "bg-red-300 text-white cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700"}`}
      >
        {deleting ? "Deleting..." : "Delete"}
      </button> */}
    </div>
  );
}
