import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-charcoal-700">{label}</label>
      )}
      <input
        ref={ref}
        className={`w-full px-4 py-2.5 text-sm bg-charcoal-50/50 border rounded-xl transition-all duration-200 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:ring-offset-0 focus:border-accent focus:bg-white hover:border-charcoal-300 ${
          error
            ? 'border-red-300 ring-1 ring-red-200 focus:ring-red-500/20 focus:border-red-500'
            : 'border-charcoal-200'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  ),
);
Input.displayName = 'Input';

interface TextareaProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-charcoal-700">{label}</label>
      )}
      <textarea
        ref={ref}
        className={`w-full px-4 py-2.5 text-sm bg-charcoal-50/50 border rounded-xl transition-all duration-200 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:ring-offset-0 focus:border-accent focus:bg-white hover:border-charcoal-300 resize-none ${
          error
            ? 'border-red-300 ring-1 ring-red-200 focus:ring-red-500/20 focus:border-red-500'
            : 'border-charcoal-200'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  ),
);
Textarea.displayName = 'Textarea';
