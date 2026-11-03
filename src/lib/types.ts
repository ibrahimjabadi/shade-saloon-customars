// Shapes of what the backend sends this app (public bootstrap data and the
// signed-in customer's own records).
export interface Settings {
  currency?: string;
  brandName?: string;
  logoUrl?: string;
  privacyPolicyEnabled?: boolean;
  requireCustomerConsent?: boolean;
  privacyPolicyAr?: string; privacyPolicyEn?: string; termsAr?: string; termsEn?: string;
  marketingConsentAr?: string; marketingConsentEn?: string;
  allowCustomerCancel?: boolean;
  allowCustomerReschedule?: boolean;
  allowCustomerDataExport?: boolean;
  allowCustomerDataDeleteRequest?: boolean;
  showCustomerBranches?: boolean;
  customerPortalEnabled?: boolean;
  customerPortalTheme?: {
    accentColor?: string; ctaLabelAr?: string; ctaLabelEn?: string;
    showServicesTab?: boolean; showPhotosTab?: boolean; showStaffTab?: boolean; showInfoTab?: boolean;
    social?: Partial<Record<"instagram" | "whatsapp" | "facebook" | "tiktok", string>>;
  };
  maintenanceMode?: { enabled?: boolean; message?: string };
}
export interface DayHours { closed?: boolean; open?: string; close?: string }
export interface Photo { url: string; caption?: string }
export interface Branch {
  id: string; name: string; active?: boolean; address?: string; city?: string; description?: string; descriptionAr?: string;
  phone?: string; googleMapsUrl?: string; coverPhotoUrl?: string; businessHours?: Partial<Record<string, DayHours>>;
  amenities?: string[]; galleryPhotos?: Photo[]; lat?: number; lng?: number;
}
export interface Service { id: string; name: string; nameAr?: string; category?: string; duration: number; price: number; active?: boolean; customerVisible?: boolean }
export interface Barber { id: string; name: string; title?: string; photoUrl?: string; branchId: string; active?: boolean; employeeStatus?: string; serviceIds?: string[]; portfolioPhotos?: Photo[] }
export interface Account { name: string; phone: string; email?: string; emailVerified?: boolean; phoneVerified?: boolean; marketingConsent?: boolean; createdAt?: string; favorites?: string[] }
export interface Slot { start: string; end: string; label?: string }
export interface Booking {
  id: string; branchId?: string; barberId?: string; serviceIds?: string[];
  branch?: { name?: string }; barber?: { id?: string; name?: string; photoUrl?: string };
  services?: { id?: string; name: string; nameAr?: string }[];
  start: string; end?: string; status?: string; total?: number; rated?: boolean; homeVisit?: { address?: string } | null;
}
export interface Loyalty {
  points: number; pointsPerVisit: number; pointsPerJd: number; visits: number; spent: number; memberSince: string | null;
  category: string; isVip: boolean;
  vip: { visitThreshold: number; spendThreshold: number; visitsLeft: number; spendLeft: number; progress: number };
  favoriteBarber: { id: string; name: string } | null;
}
export interface Offer { id: string; name: string; type: string; value: string; message: string; start: string; end: string }
export interface Notif { id: string; kind: "reminder" | "rate" | "cancelled" | "offer"; at: string; title: string; body: string; bookingId?: string; offerId?: string; start?: string; unread: boolean }
export interface AuthStart { status: "code_sent" | "need_email" | "new" | "signed_in"; customerToken?: string; account?: Account; challengeId?: string; sentTo?: string; canChangeEmail?: boolean }
