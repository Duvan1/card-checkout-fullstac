interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  showPayButton?: boolean;
  onClick?: () => void;
  onPay?: () => void;
}

export function ProductCard({
  name,
  description,
  price,
  currency,
  stock,
  showPayButton = false,
  onClick,
  onPay,
}: ProductCardProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`bg-white rounded-lg shadow-md p-6 flex flex-col gap-4 ${
        onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''
      }`}
    >
      <div>
        <h2 className="text-xl font-bold text-gray-800">{name}</h2>
        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{description}</p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold text-blue-600">
          {currency} {price.toLocaleString()}
        </span>
        <span
          className={`text-sm font-medium px-3 py-1 rounded-full ${
            stock > 0
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {stock > 0 ? `${stock} disponibles` : 'Agotado'}
        </span>
      </div>

      {showPayButton && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPay?.();
          }}
          disabled={stock === 0}
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg
                     hover:bg-blue-700 transition-colors
                     disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Pay with credit card
        </button>
      )}
    </div>
  );
}
