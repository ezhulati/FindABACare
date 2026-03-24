/**
 * Icon Component Library for Autism-Friendly Venues
 *
 * Comprehensive icon system to help parents quickly understand:
 * - Venue types
 * - Go Now meter status
 * - Sensory-friendly amenities
 * - Potential trigger warnings
 */

interface IconProps {
  className?: string;
  size?: number;
  title?: string;
}

// ============================================
// VENUE TYPE ICONS
// ============================================

export const MuseumIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M21 9L12 2L3 9V21H21V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 21V13H17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ParkIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 3C10 3 8 4 8 7C8 10 10 11 12 11C14 11 16 10 16 7C16 4 14 3 12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 11V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 21H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const LibraryIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 19V5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M9 7H15M9 11H15M9 15H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const RestaurantIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M8 2V14M8 8H6C4.89543 8 4 7.10457 4 6V2M8 8H10C11.1046 8 12 7.10457 12 6V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 14V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M16 2V8C16 9.10457 16.8954 10 18 10H18C19.1046 10 20 9.10457 20 8V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 10V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const TheaterIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 9L12 12L8 15V9Z" fill="currentColor"/>
  </svg>
);

export const GymIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M6 12H18M3 9V15M21 9V15M6 9V15M18 9V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ZooIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 18C12 18 17 14 17 10C17 7.23858 14.7614 5 12 5C9.23858 5 7 7.23858 7 10C7 14 12 18 12 18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="10" r="1.5" fill="currentColor"/>
    <path d="M15 19L12 21L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const OutdoorIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 3L4 9L12 15L20 9L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 9V15L12 21L20 15V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ============================================
// GO NOW METER ICONS
// ============================================

export const QuietIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="9" fill="#10B981" stroke="#059669" strokeWidth="2"/>
    <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ModerateIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="9" fill="#F59E0B" stroke="#D97706" strokeWidth="2"/>
    <path d="M12 8V13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="16" r="1" fill="white"/>
  </svg>
);

export const BusyIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="9" fill="#EF4444" stroke="#DC2626" strokeWidth="2"/>
    <path d="M8 8L16 16M16 8L8 16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// ============================================
// AMENITY ICONS (Positive Features)
// ============================================

export const QuietRoomIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 8V12M12 15H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 10C8 10 10 12 12 12C14 12 16 10 16 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const VisualSupportsIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 7C4 5.89543 4.89543 5 6 5H18C19.1046 5 20 5.89543 20 7V17C20 18.1046 19.1046 19 18 19H6C4.89543 19 4 18.1046 4 17V7Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M4 9H20M8 5V19M16 5V19" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const WheelchairAccessibleIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="6" r="2" fill="currentColor"/>
    <path d="M12 10V14M12 14H16M12 14C12 16.2091 10.2091 18 8 18C5.79086 18 4 16.2091 4 14C4 11.7909 5.79086 10 8 10H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ChangingTableIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="16" cy="6" r="2" fill="currentColor"/>
    <path d="M4 12H20V16H4V12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M12 16V20M16 16V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const SensoryHoursIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M17 4L19 6M7 4L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// ============================================
// TRIGGER WARNING ICONS
// ============================================

export const HandDryerWarningIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M8 4H16V10H8V4Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M10 10L8 18M14 10L16 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 2V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="15" r="1" fill="#F59E0B"/>
  </svg>
);

export const StrongScentsIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M9 8C9 6.34315 10.3431 5 12 5C13.6569 5 15 6.34315 15 8V12H9V8Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M6 12H18V16C18 18.2091 16.2091 20 14 20H10C7.79086 20 6 18.2091 6 16V12Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M4 12L6 10M20 12L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="18" cy="6" r="2" fill="#F59E0B"/>
  </svg>
);

export const LoudMusicIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M9 18V7L17 5V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <ellipse cx="7" cy="18" rx="2" ry="3" stroke="currentColor" strokeWidth="2"/>
    <ellipse cx="15" cy="16" rx="2" ry="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M19 8L21 7M19 12L21 11M19 16L21 15" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const OpenWaterIcon = ({ className = '', size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M3 12C3 12 5 10 7 10C9 10 10 12 12 12C14 12 15 10 17 10C19 10 21 12 21 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M3 16C3 16 5 14 7 14C9 14 10 16 12 16C14 16 15 14 17 14C19 14 21 16 21 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="18" cy="6" r="2" fill="#F59E0B"/>
  </svg>
);

// ============================================
// UTILITY: Get Icon by Name
// ============================================

export const getVenueTypeIcon = (type: string) => {
  const iconMap: Record<string, React.FC<IconProps>> = {
    museum: MuseumIcon,
    park: ParkIcon,
    library: LibraryIcon,
    restaurant: RestaurantIcon,
    theater: TheaterIcon,
    gym: GymIcon,
    zoo: ZooIcon,
    outdoor: OutdoorIcon,
  };
  return iconMap[type] || OutdoorIcon;
};

export const getMeterIcon = (meter: string) => {
  const iconMap: Record<string, React.FC<IconProps>> = {
    Quiet: QuietIcon,
    Moderate: ModerateIcon,
    Busy: BusyIcon,
  };
  return iconMap[meter] || ModerateIcon;
};

// Icon metadata for filters and legends
export const VENUE_TYPE_METADATA = {
  museum: { label: 'Museum', icon: MuseumIcon, color: 'text-purple-600' },
  park: { label: 'Park', icon: ParkIcon, color: 'text-green-600' },
  library: { label: 'Library', icon: LibraryIcon, color: 'text-blue-600' },
  restaurant: { label: 'Restaurant', icon: RestaurantIcon, color: 'text-orange-600' },
  theater: { label: 'Theater', icon: TheaterIcon, color: 'text-red-600' },
  gym: { label: 'Gym', icon: GymIcon, color: 'text-gray-600' },
  zoo: { label: 'Zoo', icon: ZooIcon, color: 'text-emerald-600' },
  outdoor: { label: 'Outdoor', icon: OutdoorIcon, color: 'text-teal-600' },
};

export const AMENITY_METADATA = {
  quiet_room: { label: 'Quiet Room', icon: QuietRoomIcon, description: 'Dedicated quiet space available' },
  visual_supports: { label: 'Visual Supports', icon: VisualSupportsIcon, description: 'Picture schedules and visual aids' },
  wheelchair_accessible: { label: 'Wheelchair Accessible', icon: WheelchairAccessibleIcon, description: 'Fully wheelchair accessible' },
  changing_table: { label: 'Changing Table', icon: ChangingTableIcon, description: 'Adult-sized changing table available' },
  sensory_hours: { label: 'Sensory Hours', icon: SensoryHoursIcon, description: 'Special sensory-friendly hours' },
};

export const TRIGGER_METADATA = {
  hand_dryer: { label: 'Hand Dryers', icon: HandDryerWarningIcon, description: 'Loud hand dryers present' },
  strong_scents: { label: 'Strong Scents', icon: StrongScentsIcon, description: 'May have strong fragrances' },
  loud_music: { label: 'Loud Music', icon: LoudMusicIcon, description: 'Background music can be loud' },
  open_water: { label: 'Open Water', icon: OpenWaterIcon, description: 'Unguarded water features present' },
};
