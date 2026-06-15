
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = "btn-kinetic px-4 py-1.5 rounded-sm font-bold transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed text-xs uppercase tracking-wider";

  const variants = {
    primary: "bg-[#00c030] text-white hover:bg-[#00e054] shadow-[0_2px_0_rgba(0,0,0,0.2)]",
    secondary: "bg-[#456] text-white hover:bg-[#567]",
    danger: "bg-red-600 text-white hover:bg-red-500",
    ghost: "bg-transparent text-[#9ab] hover:text-white hover:bg-[#2c3440]",
    success: "bg-[#00e054] text-[#14181c]"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <i className="fas fa-circle-notch fa-spin"></i>
      ) : children}
    </button>
  );
};
