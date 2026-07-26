import { formatCardNumber, maskCardNumber } from '../../../shared/utils/luhn';
import type { CardBrand } from '../../../shared/utils/binDetect';

interface Props {
  cardNumber: string;
  cardHolder: string;
  cardExpiry: string;
  brand: CardBrand | null;
}

export function CreditCardPreview({
  cardNumber,
  cardHolder,
  cardExpiry,
  brand,
}: Props) {
  const display = cardNumber ? formatCardNumber(maskCardNumber(cardNumber)) : '**** **** **** ****';
  const holder = cardHolder || 'NOMBRE DEL TITULAR';
  const expiry = cardExpiry || 'MM / AA';
  const brandLabel = brand === 'visa' ? 'VISA' : brand === 'mastercard' ? 'MC' : '';

  return (
    <div className="perspective-1000 w-full max-w-md mx-auto h-56 cursor-pointer group">
      <div
        className="relative w-full h-full rounded-2xl shadow-lg p-6 text-white overflow-hidden
          transition-transform duration-500 ease-out
          group-hover:rotateY-6 group-hover:rotateX-3"
        style={{
          background: 'linear-gradient(135deg, #3525cd 0%, #4f46e5 100%)',
        }}
      >
        <div className="absolute top-0 right-0 p-6 opacity-20 translate-x-1/4 -translate-y-1/4">
          <svg
            className="w-40 h-40"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
          </svg>
        </div>

        <div className="relative h-full flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="w-12 h-10 rounded-md bg-yellow-400/80 shadow-inner" />
            {brandLabel && (
              <div className="text-right">
                <div className="font-bold italic text-xl tracking-tighter">
                  {brandLabel}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="text-2xl font-mono tracking-[0.25em]">
              {display}
            </div>

            <div className="flex justify-between items-end">
              <div className="space-y-0.5">
                <div className="text-[10px] opacity-80 uppercase tracking-wider">
                  Titular
                </div>
                <div className="text-sm font-semibold tracking-wide uppercase">
                  {holder}
                </div>
              </div>
              <div className="space-y-0.5 text-right">
                <div className="text-[10px] opacity-80 uppercase tracking-wider">
                  Vence
                </div>
                <div className="text-sm font-semibold">{expiry}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
