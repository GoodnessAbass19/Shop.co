interface PreviewStepProps {
  store: any;
  product: any;
  onBack: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export default function PreviewStep({
  store,
  product,
  onBack,
  onConfirm,
  loading,
}: PreviewStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Review Store Information</h2>

      <div className="bg-white shadow rounded p-4">
        <p>
          <strong>Name:</strong> {store.name}
        </p>
        <p>
          <strong>Description:</strong> {store.description}
        </p>
        <p>
          <strong>Category:</strong> {store.category}
        </p>
        <p>
          <strong>Logo:</strong>{" "}
          <img src={store.logo} alt="Logo" className="h-16" />
        </p>
        <p>
          <strong>Banners:</strong>
        </p>
        <div className="flex gap-2">
          {store.banners?.map((url: string, idx: number) => (
            <img
              key={idx}
              src={url}
              className="w-24 h-16 object-cover rounded"
            />
          ))}
        </div>
      </div>

      <h2 className="text-lg font-semibold">Review Product Information</h2>

      <div className="bg-white shadow rounded p-4">
        <p>
          <strong>Name:</strong> {product.name}
        </p>
        <p>
          <strong>Description:</strong> {product.description}
        </p>
        <p>
          <strong>Category:</strong> {product.category}
        </p>
        <p>
          <strong>Images:</strong>
        </p>
        <div className="flex gap-2">
          {product.images?.map((img: string, idx: number) => (
            <img
              key={idx}
              src={img}
              className="w-24 h-16 object-cover rounded"
            />
          ))}
        </div>
        <p>
          <strong>Variants:</strong>
        </p>
        <ul className="text-sm list-disc ml-6">
          {product.variants?.map((variant: any, idx: number) => (
            <li key={idx}>
              {variant.size || "-"} / {variant.color || "-"} - ${variant.price}{" "}
              ({variant.stock} in stock)
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Back
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Confirm & Create"}
        </button>
      </div>
    </div>
  );
}
