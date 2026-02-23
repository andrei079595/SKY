import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`overflow-hidden bg-transparent flex items-center justify-center ${className}`}>
      <img 
        src="/logosky.png" 
        alt="SKY Logo" 
        className="h-full w-full object-contain"
        onError={(e) => {
          // Fallback if image is not yet uploaded or is empty
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          if (target.parentElement) {
            target.parentElement.innerHTML = '<div class="flex h-full w-full items-center justify-center bg-blue-900 text-white font-bold">SKY</div>';
          }
        }}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
