import type { Barber, Service } from "../api/types";

/** Branches don't carry nested staff/services arrays — barbers are a
 * separate top-level list (each with its own branchId), and services have
 * no branch relationship at all. "Services offered at this branch" is the
 * union of serviceIds across the barbers assigned there. Mirrors exactly
 * how the backend's own /api/public/branches/:id computes the same thing
 * (staffServiceIds = union of staff.flatMap(s => s.serviceIds)). */
export function branchBarbers(barbers: Barber[], branchId: string): Barber[] {
  return barbers.filter((b) => b.branchId === branchId);
}

export function branchServices(services: Service[], barbers: Barber[], branchId: string): Service[] {
  const staffServiceIds = new Set(branchBarbers(barbers, branchId).flatMap((b) => b.serviceIds || []));
  return services.filter((s) => staffServiceIds.has(s.id));
}
