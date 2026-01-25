
import React from 'react';

interface StarRatingProps {
  rating: number; // 0 to 5
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({ rating, size = 'md', showNumber = false }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  
  const sizes = {
    sm: 'text-[10px]',
    md: 'text-sm',
    lg: 'text-xl'
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className={`flex items-center gap-0.5 ${sizes[size]}`}>
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return <i key={i} className="fas fa-star text-[#00e054]"></i>;
          } else if (i === fullStars && hasHalfStar) {
            return <i key={i} className="fas fa-star-half-alt text-[#00e054]"></i>;
          } else {
            return <i key={i} className="fas fa-star text-gray-700"></i>;
          }
        })}
      </div>
      {showNumber && (
        <span className="text-[10px] font-black text-[#9ab] uppercase tracking-tighter ml-1">
          {rating}/5
        </span>
      )}
    </div>
  );
};
