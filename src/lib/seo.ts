/**
 * SEO Meta Description Utility
 *
 * Ensures all pages have properly optimized meta descriptions for search engines.
 *
 * Best Practices:
 * - Title: 50-60 characters (Google truncates at ~60)
 * - Description: 150-160 characters (Google truncates at ~160)
 * - Include primary keyword
 * - Make it compelling and actionable
 * - Unique for each page
 */

export interface SEOMetadata {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogImageAlt?: string;
  noindex?: boolean;
}

/**
 * Stock images available for use throughout the site
 */
export const STOCK_IMAGES = {
  // City images
  dallas: '/Stock Images/Dallas.jpg',
  dallasAlt: '/Stock Images/DallasABA.jpg',
  dallasOutdoor: '/Stock Images/Outdoor Dallas ABA.jpg',
  houstonOutdoor: '/Stock Images/Outdoor Houston ABA.jpg',

  // Hero/Feature images
  group: '/Stock Images/GroupABA.jpg',
  cityKids: '/Stock Images/City_ABA_Kids.jpg',
  parentConnect: '/Stock Images/ParentConnectABA.jpg',

  // Feature section images
  peacefulRoom: '/Stock Images/PeacefulRoomAba.jpg',
  sensoryVenue: '/Stock Images/Sensory-Friendly Public Venue.jpg',
  sensory: '/Stock Images/SensoryABA.jpg',
  kidsPlay: '/Stock Images/kids_play_indoor.jpg',
  library: '/Stock Images/kid_library_reading.jpg',

  // OG/Social images
  ogDefault: '/Stock Images/AutismVenue.jpg',
  ogCity: '/Stock Images/kids_city_indoor_play.jpg',

  // Additional images
  boyABA: '/Stock Images/BoyABA.jpg',
  boyArt: '/Stock Images/BoyArt.jpg',
  boyRead: '/Stock Images/BoyReadABA.jpg',
  girlABA: '/Stock Images/GirlABA.jpg',
  kidMom: '/Stock Images/KidMomABA.jpg',
  outdoorABA: '/Stock Images/OutdoorABA.jpg',
  kidsPlayABA: '/Stock Images/kidsplayaba.jpg',
  modernABA: '/Stock Images/modernABA.jpg',
};

export interface SEOValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Validates SEO metadata according to best practices
 */
export function validateSEOMetadata(metadata: SEOMetadata): SEOValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Title validation
  const titleLength = metadata.title.length;
  if (titleLength === 0) {
    errors.push('Title is required');
  } else if (titleLength < 30) {
    warnings.push(`Title is too short (${titleLength} chars). Recommended: 50-60 characters`);
  } else if (titleLength < 50) {
    warnings.push(`Title could be longer (${titleLength} chars). Optimal: 50-60 characters`);
  } else if (titleLength > 60 && titleLength <= 70) {
    warnings.push(`Title is slightly long (${titleLength} chars). May be truncated in search results`);
  } else if (titleLength > 70) {
    errors.push(`Title is too long (${titleLength} chars). Will be truncated in search results. Max: 60 characters`);
  }

  // Description validation
  const descLength = metadata.description.length;
  if (descLength === 0) {
    errors.push('Description is required');
  } else if (descLength < 120) {
    warnings.push(`Description is too short (${descLength} chars). Recommended: 150-160 characters`);
  } else if (descLength < 150) {
    warnings.push(`Description could be longer (${descLength} chars). Optimal: 150-160 characters`);
  } else if (descLength > 160 && descLength <= 170) {
    warnings.push(`Description is slightly long (${descLength} chars). May be truncated in search results`);
  } else if (descLength > 170) {
    errors.push(`Description is too long (${descLength} chars). Will be truncated in search results. Max: 160 characters`);
  }

  // Content quality checks
  if (metadata.title && !metadata.title.includes('findABA')) {
    warnings.push('Title should include brand name "findABA" or "autism.place"');
  }

  if (metadata.description && metadata.description.split(' ').length < 15) {
    warnings.push('Description seems too brief. Add more compelling details');
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Truncates text to specified length while preserving word boundaries
 */
export function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '…';
  }

  return truncated.substring(0, maxLength - 1) + '…';
}

/**
 * Generates SEO-optimized title for city pages
 */
export function generateCityTitle(cityName: string, state: string): string {
  return `${cityName}, ${state} Autism-Friendly Venues | autism.place`;
}

/**
 * Generates SEO-optimized description for city pages
 */
export function generateCityDescription(
  cityName: string,
  stateName: string,
  venueCount: number
): string {
  const desc = `Find ${venueCount} sensory-friendly venues, quiet hours, and micro-events in ${cityName}, ${stateName}. Parent-verified places that work for your child with autism.`;
  return truncateAtWord(desc, 160);
}

/**
 * Generates OG image for city pages based on city name
 */
export function generateCityOGImage(cityName: string): { ogImage: string; ogImageAlt: string } {
  const cityImages: Record<string, { ogImage: string; ogImageAlt: string }> = {
    'Dallas': {
      ogImage: STOCK_IMAGES.dallasOutdoor,
      ogImageAlt: 'Autism-friendly outdoor activities in Dallas, Texas'
    },
    'Houston': {
      ogImage: STOCK_IMAGES.houstonOutdoor,
      ogImageAlt: 'Autism-friendly outdoor activities in Houston, Texas'
    },
  };

  return cityImages[cityName] || {
    ogImage: STOCK_IMAGES.ogCity,
    ogImageAlt: `Autism-friendly venues in ${cityName}`
  };
}

/**
 * Generates SEO-optimized title for venue pages
 */
export function generateVenueTitle(venueName: string, cityName: string, state: string): string {
  return truncateAtWord(`${venueName} - ${cityName}, ${state} | autism.place`, 60);
}

/**
 * Generates SEO-optimized description for venue pages
 */
export function generateVenueDescription(
  venueName: string,
  venueType: string,
  cityName: string
): string {
  const desc = `Autism-friendly ${venueType} in ${cityName}. ${venueName} offers sensory-friendly accommodations, quiet hours, and visual supports. Parent-verified for children with autism.`;
  return truncateAtWord(desc, 160);
}

/**
 * Generates OG image for venue pages based on venue type
 */
export function generateVenueOGImage(venueType?: string): { ogImage: string; ogImageAlt: string } {
  const typeImages: Record<string, { ogImage: string; ogImageAlt: string }> = {
    'Library': {
      ogImage: STOCK_IMAGES.library,
      ogImageAlt: 'Autism-friendly library with quiet reading spaces'
    },
    'Museum': {
      ogImage: STOCK_IMAGES.sensoryVenue,
      ogImageAlt: 'Sensory-friendly museum with accommodations'
    },
    'Park': {
      ogImage: STOCK_IMAGES.outdoorABA,
      ogImageAlt: 'Autism-friendly outdoor park and playground'
    },
    'Restaurant': {
      ogImage: STOCK_IMAGES.peacefulRoom,
      ogImageAlt: 'Quiet autism-friendly dining space'
    },
    'Indoor Play': {
      ogImage: STOCK_IMAGES.kidsPlay,
      ogImageAlt: 'Indoor sensory-friendly play area'
    },
  };

  return typeImages[venueType || ''] || {
    ogImage: STOCK_IMAGES.sensoryVenue,
    ogImageAlt: 'Autism-friendly venue with sensory accommodations'
  };
}

/**
 * Development mode SEO checker
 * Logs warnings in development mode
 */
export function checkSEOInDev(metadata: SEOMetadata, pagePath: string): void {
  if (import.meta.env.DEV) {
    const validation = validateSEOMetadata(metadata);

    if (!validation.valid || validation.warnings.length > 0) {
      console.group(`🔍 SEO Check: ${pagePath}`);
      console.log('Title:', metadata.title, `(${metadata.title.length} chars)`);
      console.log('Description:', metadata.description, `(${metadata.description.length} chars)`);

      if (validation.errors.length > 0) {
        console.error('❌ Errors:', validation.errors);
      }

      if (validation.warnings.length > 0) {
        console.warn('⚠️ Warnings:', validation.warnings);
      }

      console.groupEnd();
    }
  }
}

/**
 * Common SEO metadata templates
 */
export const SEO_TEMPLATES = {
  home: {
    title: 'autism.place - Find Autism-Friendly Places for Your Child',
    description:
      'Discover sensory-friendly venues, quiet hours, and parent-verified places for children with autism in Dallas and Houston. Real experiences from real families.',
    ogImage: STOCK_IMAGES.cityKids,
    ogImageAlt: 'Children enjoying autism-friendly activities in the city',
  },
  about: {
    title: 'About autism.place - Our Mission for Autism Families',
    description:
      'autism.place helps families find autism-friendly venues through parent verification and community reviews. Safe, sensory-friendly places that work for your child.',
    ogImage: STOCK_IMAGES.parentConnect,
    ogImageAlt: 'Parents connecting and sharing autism-friendly venue experiences',
  },
  stateDirectory: (stateName: string) => ({
    title: `${stateName} Autism-Friendly Venues & Events | autism.place`,
    description: `Browse autism-friendly venues and sensory-friendly events across ${stateName}. Parent-verified places with quiet hours, visual supports, and accommodations.`,
  }),
  events: (cityName: string, state: string) => ({
    title: `${cityName}, ${state} Autism-Friendly Events | autism.place`,
    description: `Find micro-events, sensory-friendly activities, and autism-friendly gatherings in ${cityName}. Small groups, predictable schedules, parent-verified experiences.`,
  }),
  calmWindows: (cityName: string, state: string) => ({
    title: `${cityName}, ${state} Calm Windows - Quiet Hours | autism.place`,
    description: `Discover quiet hours and calm windows at ${cityName} venues. Reduced sensory input, lower crowds, and autism-friendly shopping times. Parent-verified schedules.`,
  }),
};
