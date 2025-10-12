/**
 * Event Categorization Utility
 * 
 * Categorizes events as autism-relevant based on keywords and patterns
 */

interface EventData {
  title: string;
  description: string;
  tags?: string[];
  category?: string;
}

interface CategorizationResult {
  isAutismRelevant: boolean;
  confidence: 'high' | 'medium' | 'low';
  keywords: string[];
  suggestedTags: string[];
}

// Keywords that indicate autism-relevant content
const AUTISM_KEYWORDS = [
  // Direct autism terms
  'autism', 'autistic', 'asd', 'asperger', 'aspergers',
  'neurodivergent', 'neurodiverse', 'neurodiversity',
  
  // Sensory-related
  'sensory', 'sensory-friendly', 'quiet hour', 'low stimulation',
  'noise-canceling', 'dim lights', 'sensory room',
  
  // Special needs
  'special needs', 'special education', 'exceptional children',
  'developmental disability', 'developmental delay',
  
  // Therapy and support
  'aba therapy', 'occupational therapy', 'speech therapy',
  'social skills', 'social group', 'support group',
  
  // Accommodations
  'wheelchair accessible', 'adaptive', 'inclusive', 'accessibility',
  'visual schedule', 'communication board', 'pecs',
  
  // Family support
  'respite', 'caregiver', 'parent support', 'sibling support'
];

const SENSORY_KEYWORDS = [
  'quiet', 'calm', 'low-key', 'peaceful', 'relaxed',
  'no flashing lights', 'reduced noise', 'sensory break'
];

const SOCIAL_KEYWORDS = [
  'social skills', 'peer interaction', 'friendship', 'social group',
  'playdate', 'play group'
];

const EDUCATIONAL_KEYWORDS = [
  'learning', 'educational', 'workshop', 'class', 'training',
  'seminar', 'conference'
];

/**
 * Categorizes an event based on title and description
 */
export function categorizeEvent(event: EventData): CategorizationResult {
  const text = `${event.title} ${event.description} ${event.tags?.join(' ') || ''} ${event.category || ''}`.toLowerCase();
  
  const foundKeywords: string[] = [];
  const suggestedTags: string[] = [];
  
  // Check for autism keywords
  for (const keyword of AUTISM_KEYWORDS) {
    if (text.includes(keyword.toLowerCase())) {
      foundKeywords.push(keyword);
    }
  }
  
  // Check for sensory keywords
  const hasSensory = SENSORY_KEYWORDS.some(k => text.includes(k));
  if (hasSensory) {
    suggestedTags.push('Sensory-Friendly');
  }
  
  // Check for social keywords
  const hasSocial = SOCIAL_KEYWORDS.some(k => text.includes(k));
  if (hasSocial) {
    suggestedTags.push('Social Skills');
  }
  
  // Check for educational keywords
  const hasEducational = EDUCATIONAL_KEYWORDS.some(k => text.includes(k));
  if (hasEducational) {
    suggestedTags.push('Educational');
  }
  
  // Determine relevance and confidence
  let isAutismRelevant = false;
  let confidence: 'high' | 'medium' | 'low' = 'low';
  
  if (foundKeywords.length >= 3) {
    isAutismRelevant = true;
    confidence = 'high';
  } else if (foundKeywords.length >= 1) {
    isAutismRelevant = true;
    confidence = 'medium';
  } else if (suggestedTags.length >= 2) {
    isAutismRelevant = true;
    confidence = 'low';
  }
  
  return {
    isAutismRelevant,
    confidence,
    keywords: foundKeywords,
    suggestedTags
  };
}

/**
 * Batch categorize multiple events
 */
export function categorizeEvents(events: EventData[]): Map<string, CategorizationResult> {
  const results = new Map<string, CategorizationResult>();
  
  for (const event of events) {
    const result = categorizeEvent(event);
    const key = event.title || '';
    results.set(key, result);
  }
  
  return results;
}
