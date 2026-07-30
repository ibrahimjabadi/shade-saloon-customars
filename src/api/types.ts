/* Shapes of the JSON the backend returns. This app has no data of its own
   (see README) — these types describe an external contract we don't control,
   so most fields are optional/loosely typed on purpose rather than assumed. */

export interface Settings {
  currency?: string;
  privacyPolicyEnabled?: boolean;
  requireCustomerConsent?: boolean;
  requireMarketingConsent?: boolean;
  privacyPolicyAr?: string;
  privacyPolicyEn?: string;
  termsAr?: string;
  termsEn?: string;
  marketingConsentAr?: string;
  marketingConsentEn?: string;
  allowCustomerCancel?: boolean;
  allowCustomerReschedule?: boolean;
  showCustomerPrices?: boolean;
  showCustomerBranches?: boolean;
}

export interface DayHours {
  closed?: boolean;
  open?: string;
  close?: string;
}
export type BusinessHours = Partial<Record<string, DayHours>>;

export interface GalleryPhoto {
  url: string;
  caption?: string;
}

export interface Service {
  id: string;
  name: string;
  nameAr?: string;
  category?: string;
  duration: number;
  price: number;
  active?: boolean;
  customerVisible?: boolean;
}

// Services have no branchId of their own — "which services does this branch
// offer" is derived from the union of serviceIds across the barbers
// assigned to that branch (see utils/branchCatalog.ts), matching exactly
// how the backend's own /api/public/branches/:id computes it.
export interface Branch {
  id: string;
  name: string;
  active?: boolean;
  address?: string;
  city?: string;
  description?: string;
  descriptionAr?: string;
  phone?: string;
  googleMapsUrl?: string;
  coverPhotoUrl?: string;
  // businessHours/amenities/timezone are not exposed by the backend to any
  // customer-facing endpoint today (verified against the live API on
  // 2026-07-30) — kept optional so the Info tab's hours/amenities sections
  // activate automatically, with no frontend change, if the backend ever
  // starts sending them.
  timezone?: string;
  businessHours?: BusinessHours;
  amenities?: string[];
  galleryPhotos?: GalleryPhoto[];
}

export interface Barber {
  id: string;
  name: string;
  title?: string;
  photoUrl?: string;
  branchId: string;
  active?: boolean;
  employeeStatus?: string;
  serviceIds?: string[];
  portfolioPhotos?: GalleryPhoto[];
}

export interface CustomerAccount {
  name: string;
  phone: string;
  email?: string;
}

export interface Slot {
  start: string;
  end: string;
  label: string;
  endLabel: string;
}

export type BookingStatus = "upcoming" | "completed" | "cancelled" | "no_show" | string;

export interface BookingService {
  name: string;
  nameAr?: string;
}

export interface Booking {
  id: string;
  branchId?: string;
  barberId?: string;
  serviceIds?: string[];
  branch?: { name?: string };
  barber?: { name?: string; photoUrl?: string };
  services?: BookingService[];
  start: string;
  end?: string;
  startLabel?: string;
  endLabel?: string;
  status?: BookingStatus;
  total?: number;
}

export interface BootstrapResponse {
  settings: Settings;
  branches: Branch[];
  services: Service[];
  barbers: Barber[];
}

export interface AvailabilityResponse {
  slots: Slot[];
}

export interface RegisterPayload {
  name: string;
  phone: string;
  email: string;
  consent: boolean;
  marketingConsent: boolean;
}

export interface RegisterResponse {
  customerToken: string;
  account: CustomerAccount;
}

export interface CreateBookingPayload {
  branchId: string;
  barberId: string;
  serviceIds: string[];
  start: string;
  notes: string;
}
