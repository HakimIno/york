'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

// Define variant types
type InputVariant =
  | 'default'
  | 'outline'
  | 'filled'
  | 'underlined'
  | 'ghost'
  | 'success'
  | 'warning'
  | 'error';
type InputSize = 'sm' | 'md' | 'lg' | 'xl';
type InputColor =
  | 'blue'
  | 'green'
  | 'red'
  | 'yellow'
  | 'purple'
  | 'pink'
  | 'indigo'
  | 'gray';

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: InputVariant;
  size?: InputSize;
  color?: InputColor;
  label?: string;
  helperText?: string;
  errorMessage?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Color styles
const inputColors = {
  blue: {
    border: 'border-blue-300',
    borderBottom: 'border-b-blue-300',
    hover: 'hover:border-blue-400',
    hoverBottom: 'hover:border-b-blue-400',
    focus: 'focus-visible:border-blue-500 focus-visible:ring-blue-500/20',
    focusBottom: 'focus-visible:border-b-blue-500',
    bg: 'bg-blue-50',
    text: 'text-blue-900',
    placeholder: 'placeholder:text-blue-600',
  },
  green: {
    border: 'border-green-300',
    borderBottom: 'border-b-green-300',
    hover: 'hover:border-green-400',
    hoverBottom: 'hover:border-b-green-400',
    focus: 'focus-visible:border-green-500 focus-visible:ring-green-500/20',
    focusBottom: 'focus-visible:border-b-green-500',
    bg: 'bg-green-50',
    text: 'text-green-900',
    placeholder: 'placeholder:text-green-600',
  },
  red: {
    border: 'border-red-300',
    borderBottom: 'border-b-red-300',
    hover: 'hover:border-red-400',
    hoverBottom: 'hover:border-b-red-400',
    focus: 'focus-visible:border-red-500 focus-visible:ring-red-500/20',
    focusBottom: 'focus-visible:border-b-red-500',
    bg: 'bg-red-50',
    text: 'text-red-900',
    placeholder: 'placeholder:text-red-600',
  },
  yellow: {
    border: 'border-yellow-300',
    borderBottom: 'border-b-yellow-300',
    hover: 'hover:border-yellow-400',
    hoverBottom: 'hover:border-b-yellow-400',
    focus: 'focus-visible:border-yellow-500 focus-visible:ring-yellow-500/20',
    focusBottom: 'focus-visible:border-b-yellow-500',
    bg: 'bg-yellow-50',
    text: 'text-yellow-900',
    placeholder: 'placeholder:text-yellow-600',
  },
  purple: {
    border: 'border-purple-300',
    borderBottom: 'border-b-purple-300',
    hover: 'hover:border-purple-400',
    hoverBottom: 'hover:border-b-purple-400',
    focus: 'focus-visible:border-purple-500 focus-visible:ring-purple-500/20',
    focusBottom: 'focus-visible:border-b-purple-500',
    bg: 'bg-purple-50',
    text: 'text-purple-900',
    placeholder: 'placeholder:text-purple-600',
  },
  pink: {
    border: 'border-pink-300',
    borderBottom: 'border-b-pink-300',
    hover: 'hover:border-pink-400',
    hoverBottom: 'hover:border-b-pink-400',
    focus: 'focus-visible:border-pink-500 focus-visible:ring-pink-500/20',
    focusBottom: 'focus-visible:border-b-pink-500',
    bg: 'bg-pink-50',
    text: 'text-pink-900',
    placeholder: 'placeholder:text-pink-600',
  },
  indigo: {
    border: 'border-indigo-300',
    borderBottom: 'border-b-indigo-300',
    hover: 'hover:border-indigo-400',
    hoverBottom: 'hover:border-b-indigo-400',
    focus: 'focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20',
    focusBottom: 'focus-visible:border-b-indigo-500',
    bg: 'bg-indigo-50',
    text: 'text-indigo-900',
    placeholder: 'placeholder:text-indigo-600',
  },
  gray: {
    border: 'border-zinc-200 dark:border-zinc-700',
    borderBottom: 'border-b-zinc-200 dark:border-b-zinc-700',
    hover: 'hover:border-zinc-300 dark:hover:border-zinc-600',
    hoverBottom: 'hover:border-b-zinc-300 dark:hover:border-b-zinc-600',
    focus: 'focus-visible:border-zinc-500 focus-visible:ring-zinc-500/20',
    focusBottom: 'focus-visible:border-b-zinc-500',
    bg: 'bg-zinc-50 dark:bg-zinc-800',
    text: 'text-zinc-900 dark:text-zinc-100',
    placeholder: 'placeholder:text-zinc-500 dark:placeholder:text-zinc-400',
  },
};

// Variant styles
const inputVariants = {
  default:
    'border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400',
  outline:
    'border border-zinc-200 dark:border-zinc-700 bg-transparent hover:border-zinc-300 dark:hover:border-zinc-600 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400',
  filled:
    'border border-transparent bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 focus-visible:bg-white dark:focus-visible:bg-zinc-800 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400',
  underlined:
    'border-0 border-b border-zinc-200 dark:border-zinc-700 bg-transparent rounded-none hover:border-zinc-300 dark:hover:border-zinc-600 focus-visible:border-blue-500 focus-visible:ring-0 px-0 transition-colors duration-200 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400',
  ghost:
    'border border-transparent bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800 focus-visible:bg-white dark:focus-visible:bg-zinc-800 focus-visible:border-zinc-200 dark:focus-visible:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400',
  success:
    'border border-green-500 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100 placeholder:text-green-600 dark:placeholder:text-green-400 focus-visible:border-green-600 focus-visible:ring-2 focus-visible:ring-green-500/20',
  warning:
    'border border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-100 placeholder:text-yellow-600 dark:placeholder:text-yellow-400 focus-visible:border-yellow-600 focus-visible:ring-2 focus-visible:ring-yellow-500/20',
  error:
    'border border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100 placeholder:text-red-600 dark:placeholder:text-red-400 focus-visible:border-red-600 focus-visible:ring-2 focus-visible:ring-red-500/20',
};

// Size styles
const inputSizes = {
  sm: 'h-8 px-2 py-1 text-sm',
  md: 'h-9 px-3 py-1 text-sm',
  lg: 'h-11 px-4 py-2 text-base',
  xl: 'h-12 px-5 py-3 text-lg',
};

const inputSizesUnderlined = {
  sm: 'h-8 p-0 text-sm',
  md: 'h-9 px-0 text-sm',
  lg: 'h-11 p-0  text-base',
  xl: 'h-12 p-0  text-lg',
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      variant = 'default',
      size = 'md',
      color = 'blue',
      label,
      helperText,
      errorMessage,
      leftIcon,
      rightIcon,
      placeholder,
      ...props
    },
    ref
  ) => {
    const inputId = React.useId();
    const hasError = !!errorMessage;
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    const isUnderlined = variant === 'underlined';
    const displayLabel = label;
    const showFloatingLabel = isUnderlined && (isFocused || hasValue);

    const colorStyles = inputColors[color];

    const getVariantStyles = () => {
      if (hasError && variant === 'underlined') {
        return 'border-0 border-b border-b-red-500 bg-transparent hover:border-b-red-400 focus-visible:ring-0 px-0 transition-colors duration-200 focus-visible:border-b-red-600';
      }
      if (hasError) return inputVariants.error;

      switch (variant) {
        case 'default':
          return `border ${colorStyles.border} bg-background ${colorStyles.hover} focus-visible:ring-2 ${colorStyles.focus}`;
        case 'outline':
          return `border ${colorStyles.border} bg-transparent ${colorStyles.hover} focus-visible:ring-2 ${colorStyles.focus}`;
        case 'filled':
          return `border border-transparent ${colorStyles.bg} hover:bg-opacity-80 focus-visible:bg-white focus-visible:ring-2 ${colorStyles.focus}`;
        case 'underlined':
          return `border-0 border-b border-b-gray-200 bg-transparent hover:border-b-gray-400 focus-visible:ring-0 px-0 transition-colors duration-200 ${isFocused ? colorStyles.focusBottom : ''} ${className?.includes('text-white') ? 'border-b-white/30 hover:border-b-white/50' : ''}`;
        case 'ghost':
          return `border border-transparent bg-transparent hover:${colorStyles.bg.replace('bg-', 'bg-')} focus-visible:bg-white focus-visible:${colorStyles.border}`;
        case 'success':
          return inputVariants.success;
        case 'warning':
          return inputVariants.warning;
        case 'error':
          return inputVariants.error;
        default:
          return inputVariants.default;
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0);
      props.onChange?.(e);
    };

    return (
      <div className="w-full space-y-1">
        {!isUnderlined && label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium',
              hasError ? 'text-red-700' : 'text-gray-700'
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
              {leftIcon}
            </div>
          )}

          {isUnderlined && displayLabel && (
            <label
              htmlFor={inputId}
              className={cn(
                'absolute left-0 transition-all duration-200 pointer-events-none',
                showFloatingLabel
                  ? `-top-2 text-xs -translate-y-1/2 ${hasError ? 'text-red-500' : isFocused ? `text-${color}-500` : 'text-gray-500'}`
                  : 'top-1/2 text-base text-gray-500 -translate-y-1/2',
                leftIcon && 'left-10',
                className?.includes('text-white') &&
                  !showFloatingLabel &&
                  'text-white/70',
                className?.includes('text-white') &&
                  showFloatingLabel &&
                  !hasError &&
                  !isFocused &&
                  'text-white/50'
              )}
            >
              {displayLabel}
            </label>
          )}

          <input
            id={inputId}
            type={type}
            className={cn(
              'flex w-full transition-all duration-200',
              'placeholder:text-muted-foreground',
              'focus-visible:outline-none',
              getVariantStyles(),
              isUnderlined ? inputSizesUnderlined[size] : inputSizes[size],
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              isUnderlined && 'placeholder:opacity-0',
              className?.includes('text-white') &&
                'text-white placeholder:text-white/50',
              className
            )}
            ref={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            placeholder={isUnderlined ? '' : placeholder}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>

        {(helperText || errorMessage) && (
          <p
            className={cn(
              'text-xs',
              hasError ? 'text-red-600' : 'text-gray-500'
            )}
          >
            {errorMessage || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
