import React from 'react';
import { SvgIconComponent } from '@mui/icons-material';

interface RadialCenterIconProps {
  Icon: SvgIconComponent;
  color: string;
  backgroundColor?: string; // Make optional since we're removing background
  borderColor?: string; // Make optional since we're removing background
  size?: number;
}

const RadialCenterIcon: React.FC<RadialCenterIconProps> = ({
  Icon,
  color,
  size = 48 // Increased default size
}) => {
  // Simple centering - just position the icon itself
  const iconSize = size;
  const centerOffset = iconSize / 2;
  const x = 75 - centerOffset; // Center in 200x200 SVG
  const y = 75 - centerOffset;

  return (
    <foreignObject 
      x={x} 
      y={y} 
      width={iconSize} 
      height={iconSize}
    >
      <div className="flex items-center justify-center w-full h-full transform rotate-90">
        <Icon 
          sx={{ 
            fontSize: iconSize, 
            color,
            filter: `drop-shadow(0 0 8px ${color}60)` // Add subtle glow
          }} 
        />
      </div>
    </foreignObject>
  );
};

export default RadialCenterIcon; 