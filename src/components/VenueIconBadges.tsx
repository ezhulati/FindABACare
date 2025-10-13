/**
 * Venue Icon Badges Component
 *
 * Displays icons based on ACTUAL venue data from database.
 * Only shows icons for features that are explicitly set to TRUE in the venue record.
 * No fake or assumed data.
 */

import {
  getVenueTypeIcon,
  getMeterIcon,
  QuietRoomIcon,
  VisualSupportsIcon,
  WheelchairAccessibleIcon,
  ChangingTableIcon,
  SensoryHoursIcon,
  HandDryerWarningIcon,
  StrongScentsIcon,
  LoudMusicIcon,
  OpenWaterIcon,
  AMENITY_METADATA,
  TRIGGER_METADATA,
} from './Icons';

interface VenueData {
  type: string;
  meter: string;
  amenities?: Record<string, boolean>;
  triggers?: Record<string, boolean>;
  sensory_hours?: any[];
}

interface VenueIconBadgesProps {
  venue: VenueData;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 16,
  md: 20,
  lg: 24,
};

export default function VenueIconBadges({ venue, showLabels = false, size = 'md' }: VenueIconBadgesProps) {
  const iconSize = sizeMap[size];

  // Get venue type icon
  const VenueTypeIcon = getVenueTypeIcon(venue.type);
  const MeterIcon = getMeterIcon(venue.meter);

  // Parse amenities - only show if explicitly TRUE
  const amenities = venue.amenities || {};
  const hasQuietRoom = amenities.quiet_room === true;
  const hasVisualSupports = amenities.visual_supports === true;
  const isWheelchairAccessible = amenities.wheelchair_accessible === true;
  const hasChangingTable = amenities.changing_table === true;

  // Check for sensory hours
  const hasSensoryHours = venue.sensory_hours && venue.sensory_hours.length > 0;

  // Parse triggers - only show if explicitly TRUE
  const triggers = venue.triggers || {};
  const hasHandDryer = triggers.hand_dryer === true;
  const hasStrongScents = triggers.strong_scents === true;
  const hasLoudMusic = triggers.loud_music === true;
  const hasOpenWater = triggers.open_water === true;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Venue Type & Meter */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full">
        {showLabels ? (
          <span className="text-xs font-medium text-gray-700">
            {venue.type.charAt(0).toUpperCase() + venue.type.slice(1)} • {venue.meter}
          </span>
        ) : (
          <>
            <VenueTypeIcon size={iconSize} className="text-gray-700" />
            <MeterIcon size={iconSize} />
          </>
        )}
      </div>

      {/* Positive Amenities (Green) */}
      {(hasQuietRoom || hasVisualSupports || isWheelchairAccessible || hasChangingTable || hasSensoryHours) && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-full">
          {showLabels ? (
            <span className="text-xs font-medium text-green-700">
              {[
                hasQuietRoom && "Quiet Room",
                hasVisualSupports && "Visual Supports",
                isWheelchairAccessible && "Accessible",
                hasChangingTable && "Changing Table",
                hasSensoryHours && "Sensory Hours"
              ].filter(Boolean).join(" • ")}
            </span>
          ) : (
            <>
              {hasQuietRoom && <QuietRoomIcon size={iconSize} className="text-green-600" title="Quiet Room Available" />}
              {hasVisualSupports && <VisualSupportsIcon size={iconSize} className="text-green-600" title="Visual Supports" />}
              {isWheelchairAccessible && <WheelchairAccessibleIcon size={iconSize} className="text-green-600" title="Wheelchair Accessible" />}
              {hasChangingTable && <ChangingTableIcon size={iconSize} className="text-green-600" title="Changing Table" />}
              {hasSensoryHours && <SensoryHoursIcon size={iconSize} className="text-green-600" title="Sensory-Friendly Hours" />}
            </>
          )}
        </div>
      )}

      {/* Trigger Warnings (Yellow/Orange) */}
      {(hasHandDryer || hasStrongScents || hasLoudMusic || hasOpenWater) && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-full">
          {showLabels ? (
            <span className="text-xs font-medium text-amber-700">
              {[
                hasHandDryer && "Hand Dryers",
                hasStrongScents && "Strong Scents",
                hasLoudMusic && "Loud Music",
                hasOpenWater && "Open Water"
              ].filter(Boolean).join(" • ")}
            </span>
          ) : (
            <>
              {hasHandDryer && <HandDryerWarningIcon size={iconSize} className="text-amber-600" title="Hand Dryers Present" />}
              {hasStrongScents && <StrongScentsIcon size={iconSize} className="text-amber-600" title="Strong Scents" />}
              {hasLoudMusic && <LoudMusicIcon size={iconSize} className="text-amber-600" title="Loud Music" />}
              {hasOpenWater && <OpenWaterIcon size={iconSize} className="text-amber-600" title="Open Water" />}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Detailed Icon Breakdown Component
 * Shows all amenities and triggers with labels and descriptions
 */
interface VenueIconDetailsProps {
  venue: VenueData;
}

export function VenueIconDetails({ venue }: VenueIconDetailsProps) {
  const amenities = venue.amenities || {};
  const triggers = venue.triggers || {};
  const hasSensoryHours = venue.sensory_hours && venue.sensory_hours.length > 0;

  // Filter to only show amenities that are explicitly TRUE
  const activeAmenities = Object.entries(AMENITY_METADATA).filter(([key]) => {
    if (key === 'sensory_hours') return hasSensoryHours;
    return amenities[key] === true;
  });

  // Filter to only show triggers that are explicitly TRUE
  const activeTriggers = Object.entries(TRIGGER_METADATA).filter(([key]) =>
    triggers[key] === true
  );

  if (activeAmenities.length === 0 && activeTriggers.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No sensory information available for this venue yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Positive Features */}
      {activeAmenities.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-green-700 mb-2">Sensory-Friendly Features</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {activeAmenities.map(([key, metadata]) => {
              const Icon = metadata.icon;
              return (
                <div key={key} className="flex items-start gap-2 p-2 bg-green-50 rounded-lg">
                  <Icon size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-green-900">{metadata.label}</div>
                    <div className="text-xs text-green-700">{metadata.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Potential Triggers */}
      {activeTriggers.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-amber-700 mb-2">Potential Sensory Triggers</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {activeTriggers.map(([key, metadata]) => {
              const Icon = metadata.icon;
              return (
                <div key={key} className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg">
                  <Icon size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-amber-900">{metadata.label}</div>
                    <div className="text-xs text-amber-700">{metadata.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
