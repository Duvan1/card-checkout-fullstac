interface Props {
  steps: { label: string }[];
  currentStep: number;
}

export function CheckoutStepper({ steps, currentStep }: Props) {
  return (
    <div className="flex items-center justify-center mb-12">
      <div className="flex items-center w-full max-w-md">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center relative">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  i + 1 < currentStep
                    ? 'bg-primary text-white'
                    : i + 1 === currentStep
                      ? 'bg-primary text-white ring-4 ring-primary/20 shadow-md'
                      : 'bg-surface-variant text-on-surface-variant'
                }`}
              >
                {i + 1 < currentStep ? '✓' : i + 1}
              </div>
              <span
                className={`absolute -bottom-8 whitespace-nowrap text-xs font-medium ${
                  i + 1 <= currentStep ? 'text-primary font-bold' : 'text-on-surface-variant'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-grow h-1 mx-2 mb-6 rounded-full ${
                  i + 1 < currentStep ? 'bg-primary opacity-30' : 'bg-surface-variant'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
