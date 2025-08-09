import React from 'react';

interface CenterActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  className?: string;
}

/**
 * 카카오 스타일 중앙 액션 버튼
 * - #FEE500 카카오 컬러 시스템
 * - 12px 라운드 디자인
 * - 85% 불투명도 텍스트
 */
export const CenterActionButton: React.FC<CenterActionButtonProps> = ({
  icon,
  label,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
}) => {
  const baseClasses = `
    flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium
    transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-offset-2 min-w-[80px]
  `;

  const variantClasses = {
    primary: `
      bg-yellow-400 hover:bg-yellow-500 text-gray-800/85 
      focus:ring-yellow-400 shadow-sm hover:shadow-md
      border border-yellow-500/20
    `,
    secondary: `
      bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 
      text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700
      focus:ring-gray-400
    `,
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      type="button"
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
};