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
        className={`w-full px-4 py-2.5 text-sm bg-white border-2 rounded-lg transition-colors duration-150 placeholder:text-charcoal-400 focus:outline-none focus:border-accent ${
          error ? 'border-red-500' : 'border-charcoal-200 hover:border-charcoal-400'
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
        className={`w-full px-4 py-2.5 text-sm bg-white border-2 rounded-lg transition-colors duration-150 placeholder:text-charcoal-400 focus:outline-none focus:border-accent resize-none ${
          error ? 'border-red-500' : 'border-charcoal-200 hover:border-charcoal-400'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  ),
);
Textarea.displayName = 'Textarea';
