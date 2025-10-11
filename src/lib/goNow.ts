import dayjs from 'dayjs';

type Meter = 'Quiet' | 'Moderate' | 'Busy';

const heuristics: Record<string, (d: Date) => Meter> = {
  museum: (d) => {
    const h = dayjs(d).hour();
    if (h < 11) return 'Quiet';
    if (h < 15) return 'Moderate';
    return 'Busy';
  },
  park: (d) => {
    const h = dayjs(d).hour();
    if (h < 10 || h > 18) return 'Quiet';
    if (h < 16) return 'Moderate';
    return 'Busy';
  },
  library: (d) => {
    const h = dayjs(d).hour();
    if (h < 10 || h > 17) return 'Quiet';
    if (h >= 12 && h < 14) return 'Moderate';
    return 'Busy';
  },
  restaurant: (d) => {
    const h = dayjs(d).hour();
    if ((h >= 11 && h < 12) || (h >= 17 && h < 18)) return 'Moderate';
    if ((h >= 12 && h < 14) || (h >= 18 && h < 20)) return 'Busy';
    return 'Quiet';
  },
  default: () => 'Moderate',
};

export function goNow(venueType?: string, at: Date = new Date()): Meter {
  const fn = (venueType && heuristics[venueType.toLowerCase()]) || heuristics.default;
  return fn(at);
}
