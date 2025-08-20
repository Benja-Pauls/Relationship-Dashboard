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
  // Perfect centering for 200x200 SVG with slight adjustment
  const iconSize = size;
  const centerOffset = iconSize / 2;
  const x = 100 - centerOffset; // Center in 200x200 SVG (100,100 is center)
  const y = 100 - centerOffset + 4; // Slight downward adjustment for visual centering

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