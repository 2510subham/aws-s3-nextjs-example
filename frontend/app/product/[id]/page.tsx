import ProductActions from "../../components/ProductActions";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductPage({ params }: Props) {
  const { id } = await params;

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

  const S3_BASE = process.env.NEXT_PUBLIC_S3_BASE_URL ?? "";

  let product: any = null;

  try {
    const singleRes = await fetch(`${API_BASE}/products/${id}`, {
      cache: "no-store",
    });

    if (singleRes.ok) {
      const singleJson = await singleRes.json();
      product = singleJson?.data ?? singleJson;
    } else {
      // fallback: try list endpoint
      const res = await fetch(`${API_BASE}/get-data`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        const list = json?.data ?? [];
        product = list.find((p: any) => String(p._id) === String(id));
      }
    }
  } catch (err) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">Product</h1>
        <p className="text-red-600">Failed to load product data.</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">Product not found</h1>

        <p className="text-gray-600">No product with id {id} was found.</p>
      </div>
    );
  }

  const imgUrl =
    product.image_name && S3_BASE
      ? `${S3_BASE.replace(/\/$/, "")}/${product.image_name}`
      : "";

  const price = Number(product.price);

  const displayPrice = Number.isFinite(price) ? `$${price.toFixed(2)}` : "—";

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <nav className="text-sm text-gray-500">
            <a href="/" className="hover:underline">
              Home
            </a>
            <span className="mx-2">/</span>
            <a href="/" className="hover:underline">
              Products
            </a>
            <span className="mx-2">/</span>
            <span className="text-gray-800">{product.name}</span>
          </nav>
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 items-start">
            <div className="md:col-span-1">
              <div className="w-full h-80 bg-gray-100 rounded-lg overflow-hidden border">
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={product.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {product.name}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    ID:{" "}
                    <span className="font-mono text-gray-700">
                      {product._id}
                    </span>
                  </p>
                </div>

                <div className="ml-4">
                  <ProductActions id={product._id} apiBase={API_BASE} />
                </div>
              </div>

              <div className="mt-6 text-gray-700">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Description
                </h3>
                <p className="whitespace-pre-line">
                  {product.descp || "No description provided."}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold text-indigo-600">
                    {displayPrice}
                  </div>
                  <div className="text-sm text-gray-500">
                    Inclusive of taxes
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  Image:{" "}
                  <span className="font-mono text-gray-700">
                    {product.image_name || "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
