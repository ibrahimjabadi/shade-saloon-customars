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

export interface StaffMember {
  id: string;
  name: string;
  title?: string;
  photoUrl?: string;
  portfolioPhotos?: GalleryPhoto[];
}

export interface Service {
  id: string;
  name: string;
  nameAr?: string;
  category?: string;
  duration: number;
  price: number;
  active?: boolean;
  branchId?: string;
}

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
  timezone?: string;
  businessHours?: BusinessHours;
  amenities?: string[];
  galleryPhotos?: GalleryPhoto[];
  staff?: StaffMember[];
  services?: Service[];
}

export interface Barber {
  id: string;
  name: string;
  title?: string;
  photoUrl?: string;
  branchId: string;
  active?: boolean;
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
