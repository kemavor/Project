import React from 'react';

interface LoadingAnimationProps {
  type?: 'dots' | 'morph' | 'progress' | 'wave' | 'orbit';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'white' | 'gradient';
  fullScreen?: boolean;
  text?: string;
  progress?: number; // For progress type (0-100)
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  type = 'dots',
  size = 'md',
  variant = 'primary',
  fullScreen = false,
  text,
  progress = 0
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const variantClasses = {
    primary: 'text-blue-500',
    secondary: 'text-gray-500',
    white: 'text-white',
    gradient: 'text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500'
  };

  const renderDotsAnimation = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${sizeClasses[size]} rounded-full bg-current animate-pulse`}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1.4s'
          }}
        />
      ))}
    </div>
  );

  const renderMorphAnimation = () => (
    <div className={`${sizeClasses[size]} relative`}>
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
      <div className="absolute inset-1 rounded-md bg-white animate-ping" />
      <div className="absolute inset-2 rounded-sm bg-gradient-to-r from-blue-500 to-purple-500 animate-spin" />
    </div>
  );

  const renderProgressAnimation = () => (
    <div className="w-full max-w-xs">
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {text && (
        <p className={`mt-2 text-sm text-center ${variantClasses[variant]}`}>
          {text} {progress > 0 && progress < 100 && `${Math.round(progress)}%`}
        </p>
      )}
    </div>
  );

  const renderWaveAnimation = () => (
    <div className="flex space-x-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`w-1 ${size === 'sm' ? 'h-3' : size === 'md' ? 'h-4' : 'h-6'} bg-current rounded-full animate-pulse`}
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.8s'
          }}
        />
      ))}
    </div>
  );

  const renderOrbitAnimation = () => (
    <div className={`${sizeClasses[size]} relative`}>
      <div className="absolute inset-0 border-2 border-gray-300 rounded-full" />
      <div
        className={`absolute top-0 left-1/2 w-2 h-2 -ml-1 rounded-full bg-current animate-spin`}
        style={{ animationDuration: '1s' }}
      />
      <div
        className={`absolute bottom-0 left-1/2 w-2 h-2 -ml-1 rounded-full bg-current animate-spin`}
        style={{ animationDuration: '1s', animationDirection: 'reverse' }}
      />
      <div
        className={`absolute left-0 top-1/2 w-2 h-2 -mt-1 rounded-full bg-current animate-spin`}
        style={{ animationDuration: '1.5s' }}
      />
      <div
        className={`absolute right-0 top-1/2 w-2 h-2 -mt-1 rounded-full bg-current animate-spin`}
        style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}
      />
    </div>
  );

  const renderAnimation = () => {
    switch (type) {
      case 'dots':
        return renderDotsAnimation();
      case 'morph':
        return renderMorphAnimation();
      case 'progress':
        return renderProgressAnimation();
      case 'wave':
        return renderWaveAnimation();
      case 'orbit':
        return renderOrbitAnimation();
      default:
        return renderDotsAnimation();
    }
  };

  const animation = (
    <div className={`flex flex-col items-center justify-center ${variantClasses[variant]}`}>
      {renderAnimation()}
      {text && type !== 'progress' && (
        <p className={`mt-3 text-sm ${variantClasses[variant]}`}>{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
        {animation}
      </div>
    );
  }

  return animation;
};

export default LoadingAnimation; 