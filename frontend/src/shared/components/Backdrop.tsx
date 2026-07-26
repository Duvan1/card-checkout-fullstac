interface BackdropProps {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}

export function Backdrop({ open, onClose, children }: BackdropProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        {children}
      </div>
    </div>
  );
}
