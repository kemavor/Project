import React from 'react';

interface GlassIconItem {
  icon: React.ReactNode;
  color: string;
  label: string;
}

interface GlassIconsProps {
  items: GlassIconItem[];
  className?: string;
}

declare const GlassIcons: React.FC<GlassIconsProps>;
export default GlassIcons;