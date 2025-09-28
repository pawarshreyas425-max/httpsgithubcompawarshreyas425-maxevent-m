import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'primary-dark' | 'outline-dark' | 'ghost-dark'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-black text-white hover:bg-gray-800 focus:ring-black',
    secondary: 'bg-gray-200 text-black hover:bg-gray-300 focus:ring-black',
    outline: 'border border-gray-300 text-black hover:bg-gray-100 focus:ring-black',
    ghost: 'text-black hover:bg-gray-100 focus:ring-black',

    'primary-dark': 'bg-white text-black hover:bg-gray-200 focus:ring-white focus:ring-offset-dark-900',
    'outline-dark': 'border border-gray-600 text-gray-200 hover:bg-dark-700 hover:border-gray-500 focus:ring-white focus:ring-offset-dark-900',
    'ghost-dark': 'text-gray-300 hover:bg-dark-700 hover:text-white focus:ring-white focus:ring-offset-dark-900',
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
      ) : null}
      {children}
    </button>
  )
}
