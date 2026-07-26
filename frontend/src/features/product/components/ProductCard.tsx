function getImageUrl(index: number): string {
  const variants = [
    { w: 400, h: 500 },
    { w: 400, h: 700 },
    { w: 400, h: 600 },
    { w: 400, h: 650 },
    { w: 400, h: 550 },
    { w: 400, h: 750 },
  ];
  const v = variants[index % variants.length];
  return `https://dummyimage.com/${v.w}x${v.h}/4f46e5/f5f2ff.png&text=Producto+${index + 1}`;
}

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  imageUrl?: string;
  imageIndex?: number;
  showPayButton?: boolean;
  onClick?: () => void;
  onPay?: () => void;
}

export function ProductCard({
  id: _id,
  name,
  description,
  price,
  currency,
  stock,
  imageUrl,
  imageIndex = 0,
  showPayButton = false,
  onClick,
  onPay,
}: ProductCardProps) {
  const imgSrc = imageUrl || getImageUrl(imageIndex);

  return (
    <div
      role={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`bg-white rounded-2xl border border-outline-variant overflow-hidden
        shadow-sm transition-all duration-200 ease-out
        ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : ''}`}
    >
      <div className="bg-surface-container overflow-hidden">
        <img src={imgSrc} alt={name} className="w-full h-auto object-cover" />
      </div>

      <div className="p-5 flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold text-on-surface leading-tight">
            {name}
          </h2>
          <p className="text-sm text-on-surface-variant mt-1 line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary tabular-nums tracking-tight">
            {currency} {price.toLocaleString()}
          </span>

          {stock > 0 ? (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-secondary/10 text-secondary">
              {stock} disponibles
            </span>
          ) : (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-error/10 text-error">
              Agotado
            </span>
          )}
        </div>

        {showPayButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPay?.();
            }}
            disabled={stock === 0}
            className="w-full bg-primary text-on-primary font-semibold py-3 rounded-lg
              hover:bg-primary-hover active:scale-95
              transition-all duration-150 ease-out
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              disabled:bg-surface-container-high disabled:text-outline disabled:cursor-not-allowed disabled:scale-100"
          >
            Pagar con tarjeta de crédito
          </button>
        )}
      </div>
    </div>
  );
}
