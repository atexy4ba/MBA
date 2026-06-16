import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary:
    'bg-accent text-white hover:bg-accent-hover ' +
    'shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 hover:-translate-y-px',
  secondary:
    'bg-charcoal-900 text-white hover:bg-charcoal-800 ' +
    'shadow-md shadow-charcoal-900/10',
  outline:
    'ring-1 ring-inset ring-charcoal-300 text-charcoal-700 ' +
    'hover:ring-charcoal-400 hover:bg-charcoal-50/50',
  ghost:
    'text-charcoal-600 hover:text-charcoal-900 hover:bg-charcoal-500/5',
};

const sizes = {
  sm: 'px-3 py-2 text-sm rounded-xl',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3 text-base rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center font-medium tracking-tight transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/25 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
