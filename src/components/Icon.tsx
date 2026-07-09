import React from 'react';
import Svg, { Path, Circle, Polyline, Polygon, Line, Rect } from 'react-native-svg';
import { colors } from '../theme';

export type IconName =
  | 'home' | 'wallet' | 'trending' | 'users' | 'menu' | 'arrow-left' | 'bell' | 'search'
  | 'plus' | 'minus' | 'x' | 'check' | 'edit' | 'trash' | 'logout' | 'chevron-right'
  | 'chevron-down' | 'chevron-left' | 'briefcase' | 'package' | 'calendar' | 'clock'
  | 'cash' | 'card' | 'phone' | 'star' | 'settings' | 'pie' | 'tag' | 'scissors'
  | 'user' | 'users-2' | 'list' | 'file' | 'truck' | 'arrow-up' | 'arrow-down'
  | 'check-circle' | 'alert' | 'eye' | 'eye-off' | 'printer' | 'send' | 'refresh'
  | 'filter' | 'shopping-bag';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const Icon: React.FC<IconProps> = ({ name, size = 18, color = colors.text2, strokeWidth = 1.6 }) => {
  const common = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {render(name, common)}
    </Svg>
  );
};

const render = (name: IconName, p: any): React.ReactNode => {
  switch (name) {
    case 'home':
      return <><Path {...p} d="M3 11l9-8 9 8" /><Path {...p} d="M5 10v10h14V10" /></>;
    case 'wallet':
      return <><Rect {...p} x="2" y="6" width="20" height="14" rx="2" /><Path {...p} d="M16 13h2" /><Path {...p} d="M2 10h20" /></>;
    case 'trending':
      return <><Polyline {...p} points="22,6 13.5,14.5 8.5,9.5 2,16" /><Polyline {...p} points="16,6 22,6 22,12" /></>;
    case 'users':
      return <><Path {...p} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><Circle {...p} cx="9" cy="7" r="4" /><Path {...p} d="M22 21v-2a4 4 0 0 0-3-3.87" /><Path {...p} d="M16 3.13a4 4 0 0 1 0 7.75" /></>;
    case 'users-2':
      return <><Path {...p} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><Circle {...p} cx="9" cy="7" r="4" /></>;
    case 'menu':
      return <><Line {...p} x1="3" y1="6" x2="21" y2="6" /><Line {...p} x1="3" y1="12" x2="21" y2="12" /><Line {...p} x1="3" y1="18" x2="21" y2="18" /></>;
    case 'arrow-left':
      return <><Line {...p} x1="19" y1="12" x2="5" y2="12" /><Polyline {...p} points="12,19 5,12 12,5" /></>;
    case 'arrow-up':
      return <><Line {...p} x1="12" y1="19" x2="12" y2="5" /><Polyline {...p} points="5,12 12,5 19,12" /></>;
    case 'arrow-down':
      return <><Line {...p} x1="12" y1="5" x2="12" y2="19" /><Polyline {...p} points="19,12 12,19 5,12" /></>;
    case 'bell':
      return <><Path {...p} d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><Path {...p} d="M13.73 21a2 2 0 0 1-3.46 0" /></>;
    case 'search':
      return <><Circle {...p} cx="11" cy="11" r="8" /><Line {...p} x1="21" y1="21" x2="16.65" y2="16.65" /></>;
    case 'plus':
      return <><Line {...p} x1="12" y1="5" x2="12" y2="19" /><Line {...p} x1="5" y1="12" x2="19" y2="12" /></>;
    case 'minus':
      return <Line {...p} x1="5" y1="12" x2="19" y2="12" />;
    case 'x':
      return <><Line {...p} x1="18" y1="6" x2="6" y2="18" /><Line {...p} x1="6" y1="6" x2="18" y2="18" /></>;
    case 'check':
      return <Polyline {...p} points="20,6 9,17 4,12" />;
    case 'check-circle':
      return <><Path {...p} d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><Polyline {...p} points="22,4 12,14.01 9,11.01" /></>;
    case 'edit':
      return <><Path {...p} d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><Path {...p} d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>;
    case 'trash':
      return <><Polyline {...p} points="3,6 5,6 21,6" /><Path {...p} d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><Path {...p} d="M10 11v6" /><Path {...p} d="M14 11v6" /></>;
    case 'logout':
      return <><Path {...p} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><Polyline {...p} points="16,17 21,12 16,7" /><Line {...p} x1="21" y1="12" x2="9" y2="12" /></>;
    case 'chevron-right':
      return <Polyline {...p} points="9,18 15,12 9,6" />;
    case 'chevron-down':
      return <Polyline {...p} points="6,9 12,15 18,9" />;
    case 'chevron-left':
      return <Polyline {...p} points="15,18 9,12 15,6" />;
    case 'briefcase':
      return <><Rect {...p} x="2" y="7" width="20" height="14" rx="2" /><Path {...p} d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>;
    case 'package':
      return <><Path {...p} d="M16.5 9.4l-9-5.19" /><Path {...p} d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><Polyline {...p} points="3.27,6.96 12,12.01 20.73,6.96" /><Line {...p} x1="12" y1="22.08" x2="12" y2="12" /></>;
    case 'calendar':
      return <><Rect {...p} x="3" y="4" width="18" height="18" rx="2" /><Line {...p} x1="16" y1="2" x2="16" y2="6" /><Line {...p} x1="8" y1="2" x2="8" y2="6" /><Line {...p} x1="3" y1="10" x2="21" y2="10" /></>;
    case 'clock':
      return <><Circle {...p} cx="12" cy="12" r="10" /><Polyline {...p} points="12,6 12,12 16,14" /></>;
    case 'cash':
      return <><Rect {...p} x="2" y="6" width="20" height="12" rx="2" /><Circle {...p} cx="12" cy="12" r="2" /><Line {...p} x1="6" y1="12" x2="6" y2="12.01" /><Line {...p} x1="18" y1="12" x2="18" y2="12.01" /></>;
    case 'card':
      return <><Rect {...p} x="2" y="5" width="20" height="14" rx="2" /><Line {...p} x1="2" y1="10" x2="22" y2="10" /></>;
    case 'phone':
      return <Path {...p} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />;
    case 'star':
      return <Path {...p} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />;
    case 'settings':
      return <><Circle {...p} cx="12" cy="12" r="3" /><Path {...p} d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>;
    case 'pie':
      return <><Path {...p} d="M21.21 15.89A10 10 0 1 1 8 2.83" /><Path {...p} d="M22 12A10 10 0 0 0 12 2v10z" /></>;
    case 'tag':
      return <><Path {...p} d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><Line {...p} x1="7" y1="7" x2="7.01" y2="7" /></>;
    case 'scissors':
      return <><Circle {...p} cx="6" cy="6" r="3" /><Circle {...p} cx="6" cy="18" r="3" /><Line {...p} x1="20" y1="4" x2="8.12" y2="15.88" /><Line {...p} x1="14.47" y1="14.48" x2="20" y2="20" /><Line {...p} x1="8.12" y1="8.12" x2="12" y2="12" /></>;
    case 'user':
      return <><Path {...p} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><Circle {...p} cx="12" cy="7" r="4" /></>;
    case 'list':
      return <><Line {...p} x1="8" y1="6" x2="21" y2="6" /><Line {...p} x1="8" y1="12" x2="21" y2="12" /><Line {...p} x1="8" y1="18" x2="21" y2="18" /><Line {...p} x1="3" y1="6" x2="3.01" y2="6" /><Line {...p} x1="3" y1="12" x2="3.01" y2="12" /><Line {...p} x1="3" y1="18" x2="3.01" y2="18" /></>;
    case 'file':
      return <><Path {...p} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><Polyline {...p} points="14,2 14,8 20,8" /></>;
    case 'truck':
      return <><Rect {...p} x="1" y="3" width="15" height="13" /><Polygon {...p as any} points="16,8 20,8 23,11 23,16 16,16 16,8" /><Circle {...p} cx="5.5" cy="18.5" r="2.5" /><Circle {...p} cx="18.5" cy="18.5" r="2.5" /></>;
    case 'alert':
      return <><Path {...p} d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><Line {...p} x1="12" y1="9" x2="12" y2="13" /><Line {...p} x1="12" y1="17" x2="12.01" y2="17" /></>;
    case 'eye':
      return <><Path {...p} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><Circle {...p} cx="12" cy="12" r="3" /></>;
    case 'eye-off':
      return <><Path {...p} d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><Line {...p} x1="1" y1="1" x2="23" y2="23" /></>;
    case 'printer':
      return <><Polyline {...p} points="6,9 6,2 18,2 18,9" /><Path {...p} d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><Rect {...p} x="6" y="14" width="12" height="8" /></>;
    case 'send':
      return <><Line {...p} x1="22" y1="2" x2="11" y2="13" /><Polygon {...p as any} points="22,2 15,22 11,13 2,9 22,2" /></>;
    case 'refresh':
      return <><Polyline {...p} points="23,4 23,10 17,10" /><Polyline {...p} points="1,20 1,14 7,14" /><Path {...p} d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></>;
    case 'filter':
      return <Polygon {...p as any} points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3" />;
    case 'shopping-bag':
      return <><Path {...p} d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><Line {...p} x1="3" y1="6" x2="21" y2="6" /><Path {...p} d="M16 10a4 4 0 0 1-8 0" /></>;
    default:
      return null;
  }
};
