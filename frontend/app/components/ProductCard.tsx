"use client";
import React from "react";
import Link from "next/link";

type Product = {
  _id: string;
  name?: string;
  descp?: string;
  price?: number | string;
  image_name?: string;
};

type Props = {
  product: Product;
  s3Base?: string;
};

const ProductCard: React.FC<Props> = ({ product, s3Base }) => {
  const imgUrl =
    product.image_name && s3Base
      ? `${s3Base.replace(/\/$/, "")}/${product.image_name}`
      : "";

  const rawPrice = Number(product.price);
  const displayPrice = Number.isFinite(rawPrice)
    ? `$${rawPrice.toFixed(2)}`
    : "—";

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
      <div className="h-44 bg-gray-50 flex items-center justify-center overflow-hidden">
        {imgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgUrl}
            alt={product.name}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="text-gray-400">No image</div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-semibold text-black truncate">
          {product.name ?? "Untitled product"}
        </h3>
        <p className="text-sm text-gray-600 mt-2 line-clamp-3 flex-1">
          {product.descp ?? "No description"}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-lg font-bold text-black">{displayPrice}</div>
          <Link
            href={`/product/${product._id}`}
            className="text-sm text-indigo-600 hover:underline"
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
