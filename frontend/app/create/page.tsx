"use client";
import React, {
  useState,
  ChangeEvent,
  FormEvent,
  useRef,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ProductForm: React.FC = () => {
  const [productName, setProductName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    if (!f) {
      setImage(null);
      setImagePreview(null);
      return;
    }

    // Validate type and size (limit 5MB)
    const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    const maxBytes = 5 * 1024 * 1024; // 5MB
    if (!allowed.includes(f.type)) {
      setErrorMessage("Unsupported image type. Use PNG, JPEG, WEBP, or GIF.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setImage(null);
      setImagePreview(null);
      return;
    }
    if (f.size > maxBytes) {
      setErrorMessage("Image is too large — max 5MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setImage(null);
      setImagePreview(null);
      return;
    }

    setErrorMessage(null);
    setImage(f);
    const url = URL.createObjectURL(f);
    setImagePreview(url);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!image) {
      setErrorMessage("Please select an image to upload.");
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMessage("Please enter a valid positive price.");
      return;
    }

    setIsSubmitting(true);

    const fetchWithTimeout = async (
      input: RequestInfo,
      init?: RequestInit,
      timeoutMs = 30000,
    ) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        // merge signals if provided
        const mergedInit = {
          ...(init ?? {}),
          signal: controller.signal,
        } as RequestInit;
        const r = await fetch(input, mergedInit);
        return r;
      } finally {
        clearTimeout(id);
      }
    };

    try {
      // Get presigned URL
      const resp = await fetchWithTimeout(`${API_BASE}/get-presigned-uri`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mime_type: image.type }),
      });
      if (!resp || !resp.ok)
        throw new Error("Failed to get presigned upload URL.");
      const data = await resp.json();

      // Upload the image to S3 (presigned URL)
      const uploadImg = await fetchWithTimeout(data.uri, {
        method: "PUT",
        headers: { "Content-Type": image.type },
        body: image,
      });
      if (!uploadImg || !uploadImg.ok) throw new Error("Image upload failed.");

      // Store metadata in DB
      const storeData = await fetchWithTimeout(`${API_BASE}/store-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: productName,
          descp: description,
          price: priceNum,
          image_name: data.file_name,
        }),
      });
      if (!storeData || !storeData.ok)
        throw new Error("Failed to store product data.");

      setSuccessMessage("Product uploaded and saved successfully.");
      // reset form
      setProductName("");
      setDescription("");
      setPrice("");
      setImage(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // navigate home after a brief delay to allow user to read success
      setTimeout(() => router.push("/"), 600);
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setErrorMessage("Request timed out. Please try again.");
      } else {
        setErrorMessage(err?.message ?? "An unexpected error occurred.");
      }
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-50 p-6 text-black">
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-black">Create Product</h2>
            <p className="text-sm text-gray-600">
              Add a product to the demo storefront
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-gray-600 hover:underline">
              ← Back to products
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <form onSubmit={handleSubmit} className="md:col-span-2 space-y-4">
            {errorMessage && (
              <div
                role="alert"
                className="text-red-600 text-sm"
                aria-live="assertive"
              >
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div
                role="status"
                className="text-green-600 text-sm"
                aria-live="polite"
              >
                {successMessage}
              </div>
            )}
            {/* Product Name */}
            <div>
              <label className="block mb-1 font-medium text-black">
                Product Name
              </label>

              <input
                type="text"
                placeholder="Enter product name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                maxLength={100}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black placeholder-gray-500 outline-none focus:ring-2 focus:ring-black"
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                {productName.length}/100
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block mb-1 font-medium text-black">
                Description
              </label>

              <textarea
                placeholder="Enter product description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                maxLength={1000}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black placeholder-gray-500 outline-none focus:ring-2 focus:ring-black"
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                {description.length}/1000
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block mb-1 font-medium text-black">Price</label>

              <input
                type="number"
                placeholder="Enter product price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min={0}
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black placeholder-gray-500 outline-none focus:ring-2 focus:ring-black"
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                Use a positive number (e.g. 19.99)
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block mb-1 font-medium text-black">
                Upload Image
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleImageChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black"
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                PNG, JPEG, WEBP, GIF — max 5MB
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className={`bg-indigo-600 text-white px-4 py-2 rounded-lg transition ${isSubmitting ? "opacity-60 cursor-not-allowed" : "hover:bg-indigo-700"}`}
              >
                {isSubmitting ? "Submitting..." : "Create product"}
              </button>

              <Link href="/" className="text-sm text-gray-600 hover:underline">
                Cancel
              </Link>
            </div>
          </form>

          {/* Preview column */}
          <aside className="md:col-span-1">
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Preview
              </h3>
              <div className="bg-white rounded-md overflow-hidden shadow-sm">
                <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imagePreview}
                      alt="preview"
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="text-gray-400">No image selected</div>
                  )}
                </div>
                <div className="p-3">
                  <h4 className="font-semibold text-black truncate">
                    {productName || "Untitled product"}
                  </h4>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                    {description || "No description"}
                  </p>
                  <div className="mt-3 text-lg font-bold text-black">
                    {price ? `$${Number(price).toFixed(2)}` : "—"}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
