import type { Event } from './types.js';

export function eventToPayload(event: Event): Record<string, any> {
  return { ...event };
}
