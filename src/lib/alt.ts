/** Alt text for the drawn aircraft art: a side or top view in a neutral finish (DESIGN.md §8). */
import type { AppAircraft } from '@/lib/app-data';

export function aircraftAlt(a: AppAircraft): string {
  return `${a.name} drawn as a collector's print: ${a.role.toLowerCase()} with ${a.power.toLowerCase()}, in a plain finish with no markings`;
}
