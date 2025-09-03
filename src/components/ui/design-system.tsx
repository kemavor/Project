import React from 'react';
import { cn } from '../../lib/utils';

// ============================================================================
// TYPOGRAPHY COMPONENTS
// ============================================================================

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
}

export const H1: React.FC<TypographyProps> = ({ children, className }) => (
  <h1 className={cn('text-h1', className)}>{children}</h1>
);

export const H2: React.FC<TypographyProps> = ({ children, className }) => (
  <h2 className={cn('text-h2', className)}>{children}</h2>
);

export const H3: React.FC<TypographyProps> = ({ children, className }) => (
  <h3 className={cn('text-h3', className)}>{children}</h3>
);

export const H4: React.FC<TypographyProps> = ({ children, className }) => (
  <h4 className={cn('text-h4', className)}>{children}</h4>
);

export const H5: React.FC<TypographyProps> = ({ children, className }) => (
  <h5 className={cn('text-h5', className)}>{children}</h5>
);

export const H6: React.FC<TypographyProps> = ({ children, className }) => (
  <h6 className={cn('text-h6', className)}>{children}</h6>
);

export const LargeText: React.FC<TypographyProps> = ({ children, className }) => (
  <p className={cn('text-large', className)}>{children}</p>
);

export const MediumText: React.FC<TypographyProps> = ({ children, className }) => (
  <p className={cn('text-medium', className)}>{children}</p>
);

export const NormalText: React.FC<TypographyProps> = ({ children, className }) => (
  <p className={cn('text-normal', className)}>{children}</p>
);

export const SmallText: React.FC<TypographyProps> = ({ children, className }) => (
  <p className={cn('text-small', className)}>{children}</p>
);

// ============================================================================
// BUTTON COMPONENTS
// ============================================================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'icon';
  size?: 'small' | 'normal' | 'medium' | 'large';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'normal',
  fullWidth = false,
  icon,
  children,
  className,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer';
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-[#2563EB] focus:ring-primary shadow-sm hover:shadow-md hover:-translate-y-0.5',
    secondary: 'bg-secondary text-white hover:bg-[#D97706] focus:ring-secondary shadow-sm hover:shadow-md hover:-translate-y-0.5',
    outline: 'bg-transparent text-primary border-1.5 border-primary hover:bg-primary hover:text-white focus:ring-primary hover:shadow-md hover:-translate-y-0.5',
    icon: 'bg-primary text-white hover:bg-[#2563EB] focus:ring-primary rounded-full shadow-sm hover:shadow-md hover:-translate-y-0.5'
  };
  
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm rounded-md',
    normal: 'px-4 py-2 text-base rounded-lg',
    medium: 'px-6 py-2.5 text-lg rounded-lg',
    large: 'px-8 py-3 text-xl rounded-xl'
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        widthClass,
        className
      )}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

// ============================================================================
// TEXT FIELD COMPONENTS
// ============================================================================

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  status?: 'success' | 'warning' | 'error' | 'default';
  statusMessage?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  status = 'default',
  statusMessage,
  icon,
  fullWidth = false,
  className,
  ...props
}) => {
  const statusClasses = {
    default: 'border-gray-300 focus:border-primary focus:ring-primary',
    success: 'border-success focus:border-success focus:ring-success',
    warning: 'border-warning focus:border-warning focus:ring-warning',
    error: 'border-error focus:border-error focus:ring-error'
  };
  
  const statusTextClasses = {
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
    default: 'text-gray-500'
  };
  
  return (
    <div className={cn('space-y-2', fullWidth && 'w-full')}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          className={cn(
            'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all',
            statusClasses[status],
            icon && 'pr-10',
            className
          )}
          {...props}
        />
        {icon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {icon}
          </div>
        )}
      </div>
      {statusMessage && (
        <p className={cn('text-sm', statusTextClasses[status])}>
          {statusMessage}
        </p>
      )}
    </div>
  );
};

// ============================================================================
// SELECTOR COMPONENTS
// ============================================================================

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  fullWidth?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  fullWidth = false,
  className,
  ...props
}) => {
  return (
    <div className={cn('space-y-2', fullWidth && 'w-full')}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        className={cn(
          'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  size?: 'small' | 'large';
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  size = 'small',
  className,
  ...props
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    large: 'w-6 h-6'
  };
  
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="checkbox"
        className={cn(
          'rounded border-gray-300 text-primary focus:ring-primary focus:ring-2',
          sizeClasses[size],
          className
        )}
        {...props}
      />
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
};

interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Radio: React.FC<RadioProps> = ({
  label,
  className,
  ...props
}) => {
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="radio"
        className={cn(
          'w-4 h-4 border-gray-300 text-primary focus:ring-primary focus:ring-2',
          className
        )}
        {...props}
      />
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
};

interface ToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  label,
  className,
  ...props
}) => {
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          {...props}
        />
        <div className={cn(
          'w-11 h-6 bg-gray-200 rounded-full transition-all',
          props.checked && 'bg-primary',
          className
        )}>
          <div className={cn(
            'w-5 h-5 bg-white rounded-full shadow transform transition-transform',
            props.checked ? 'translate-x-5' : 'translate-x-0'
          )} />
        </div>
      </div>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
};

// ============================================================================
// CARD COMPONENTS
// ============================================================================

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'image' | 'header' | 'subtitle';
  image?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  image,
  title,
  subtitle,
  description,
  action,
  ...props
}) => {
  const baseClasses = 'bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1';
  
  if (variant === 'image' && image) {
    return (
      <div className={cn(baseClasses, className)} {...props}>
        <img src={image} alt={title} className="w-full h-48 object-cover" />
        <div className="p-6">
          {title && <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>}
          {description && <p className="text-gray-600 mb-4">{description}</p>}
          {action && <div className="mt-4">{action}</div>}
        </div>
      </div>
    );
  }
  
  if (variant === 'header') {
    return (
      <div className={cn(baseClasses, className)} {...props}>
        <div className="bg-primary text-white px-6 py-4">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="p-6">
          {description && <p className="text-gray-600">{description}</p>}
          {action && <div className="mt-4">{action}</div>}
        </div>
      </div>
    );
  }
  
  if (variant === 'subtitle') {
    return (
      <div className={cn(baseClasses, className)} {...props}>
        <div className="p-6">
          {subtitle && <p className="text-sm text-gray-500 mb-1">{subtitle}</p>}
          {title && <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>}
          {description && <p className="text-gray-600 mb-4">{description}</p>}
          {action && <div className="mt-4">{action}</div>}
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn(baseClasses, className)} {...props}>
      {children}
    </div>
  );
};

// ============================================================================
// PROGRESS COMPONENTS
// ============================================================================

interface ProgressProps {
  value: number;
  max?: number;
  variant?: 'linear' | 'circular' | 'semi-circular';
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  variant = 'linear',
  size = 'medium',
  showLabel = false,
  className
}) => {
  const percentage = (value / max) * 100;
  
  if (variant === 'linear') {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <p className="text-sm text-gray-600">
            {value} of {max} Progress
          </p>
        )}
      </div>
    );
  }
  
  if (variant === 'circular') {
    const radius = size === 'small' ? 20 : size === 'large' ? 40 : 30;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    return (
      <div className={cn('inline-flex items-center justify-center', className)}>
        <svg
          className="transform -rotate-90"
          width={radius * 2 + 10}
          height={radius * 2 + 10}
        >
          <circle
            cx={radius + 5}
            cy={radius + 5}
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx={radius + 5}
            cy={radius + 5}
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="text-primary transition-all duration-300"
          />
        </svg>
        {showLabel && (
          <div className="absolute text-center">
            <div className="text-lg font-semibold text-primary">{Math.round(percentage)}%</div>
            <div className="text-xs text-gray-600">{value} of {max} Progress</div>
          </div>
        )}
      </div>
    );
  }
  
  return null;
};

// ============================================================================
// BADGE COMPONENTS
// ============================================================================

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'light' | 'dark';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  className
}) => {
  const variantClasses = {
    primary: 'bg-primary text-white shadow-sm',
    secondary: 'bg-secondary text-white shadow-sm',
    success: 'bg-success text-white shadow-sm',
    info: 'bg-info text-white shadow-sm',
    warning: 'bg-warning text-white shadow-sm',
    error: 'bg-error text-white shadow-sm',
    light: 'bg-gray-100 text-gray-700 border border-gray-200',
    dark: 'bg-gray-800 text-white shadow-sm'
  };
  
  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs rounded-md',
    medium: 'px-3 py-1 text-sm rounded-lg',
    large: 'px-4 py-1.5 text-base rounded-xl'
  };
  
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium transition-all duration-200',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
};

 