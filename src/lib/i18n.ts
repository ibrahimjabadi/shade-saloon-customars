// Every text in the app, Arabic first. t("key") picks the current language;
// a key missing from English falls back to Arabic.
export type Lang = "ar" | "en";

const ar = {
  // shell
  tabHome: "الرئيسية", tabBook: "احجز", tabBookings: "حجوزاتي", tabExplore: "استكشف", tabAccount: "حسابي",
  offline: "ما في إنترنت — بنحاول نرجع نتصل",
  close: "إغلاق", back: "رجوع", next: "التالي", done: "تمام", cancel: "إلغاء", save: "حفظ", retry: "إعادة المحاولة",
  loading: "لحظة…", errNetwork: "ما قدرنا نوصل للصالون. تأكد من الإنترنت وجرّب كمان مرة.", errGeneric: "صار خطأ، جرّب كمان مرة.",
  min: "د", minutes: "دقيقة", langSwitch: "English",
  // home
  hello: "أهلين", guestHello: "أهلاً فيك", openNow: "مفتوح هلق", closedNow: "مسكّر هلق", closesAt: "بسكّر", opensAt: "بفتح",
  bookNow: "احجز موعد", homeVisit: "زيارة منزلية", call: "اتصل", directions: "الاتجاهات",
  nextVisit: "موعدك الجاي", reschedule: "تغيير الموعد", cancelBooking: "إلغاء",
  services: "الخدمات", photos: "الصور", team: "الفريق", info: "معلومات",
  about: "عن الفرع", hours: "ساعات العمل", amenities: "المميزات", followUs: "تابعنا", closed: "مسكّر",
  noServices: "ما في خدمات معروضة", noPhotos: "ما في صور لسا", noTeam: "ما في حلاقين",
  bookThis: "احجز", added: "مضافة", allBranches: "الفروع", changeBranch: "غيّر الفرع", yourBranch: "فرعك",
  homeVisitPitch: "الحلاق بيجيك عالبيت", homeVisitPitchSub: "اختار موقعك وبنحسبلك سعر المشوار",
  offersTitle: "عروض إلك",
  // booking
  where: "وين بدك الموعد؟", atSalon: "بالصالون", atHome: "بالبيت", atHomeSub: "الحلاق بيجيك، مع سعر المشوار",
  stepPlace: "المكان", stepAddress: "العنوان", stepServices: "الخدمات", stepBarber: "الحلاق", stepTime: "الوقت", stepFirst: "أول زيارة؟", stepAccount: "حسابك", stepConfirm: "التأكيد",
  all: "الكل", anyBarber: "أي حلاق فاضي", pickDate: "اختار يوم", noSlots: "ما في أوقات فاضية بهاليوم", noSlotsHint: "جرّب يوم ثاني أو حلاق ثاني",
  slotGone: "الوقت اللي اخترته انحجز هلق، اختار وقت ثاني", firstQ: "هاي أول زيارة إلك لشادي صالون؟", firstYes: "أيوا، أول مرة", firstYesSub: "بنخلي الحلاق يعرف", firstNo: "لا، زرتكم قبل", firstNoSub: "أهلاً فيك من جديد",
  confirmBooking: "تأكيد الحجز", total: "المجموع", servicesTotal: "الخدمات", travelFee: "سعر المشوار", estTotal: "الإجمالي التقديري", travelNote: "سعر المشوار تقديري وبينحسب نهائياً بالصالون.",
  policy: "سياسة الإلغاء", policyFree: "بتقدر تلغي أو تغيّر موعدك من التطبيق قبل الموعد.", policyRestricted: "للإلغاء أو التغيير تواصل مع الفرع.",
  leaveQ: "بدك تطلع من الحجز؟ اختياراتك رح تروح.",
  useMyLocation: "استخدم موقعي", mapHint: "أو اكبس على الخريطة لتحدد مكانك بالزبط", locating: "عم نحدد موقعك…", resolving: "عم نجيب العنوان…", locError: "ما قدرنا نوصل لموقعك. اسمح بالموقع أو حدد مكانك على الخريطة.",
  kmAway: "كم عن الفرع", perKm: "للكيلو", homeOff: "الحجز المنزلي مش متاح هلق",
  homeOnlyServices: "الخدمات المتاحة بالبيت، بسعرها المنزلي",
  // success
  booked: "انحجز موعدك ✓", seeYou: "بنشوفك قريب", ref: "رقم الحجز", branch: "الفرع", barber: "الحلاق", time: "الوقت",
  addCalendar: "أضف للتقويم", rateGoogle: "عجبك الصالون؟ قيّمنا على Google", notNow: "مش هلق", toMyBookings: "حجوزاتي",
  // bookings
  upcoming: "الجاية", past: "السابقة", noUpcoming: "ما عندك مواعيد جاية", noPast: "ما في زيارات سابقة", bookFirst: "احجز موعدك الأول",
  signInToSee: "سجّل دخول لتشوف حجوزاتك", signIn: "تسجيل الدخول",
  st_upcoming: "جاي", st_completed: "مكتمل", st_cancelled: "ملغي", st_no_show: "ما حضرت", st_past: "انتهى",
  cancelQ: "متأكد بدك تلغي هالموعد؟", cancelled: "انلغى الموعد", rescheduled: "تغيّر الموعد", bookAgain: "احجز نفسه",
  rate: "قيّم الزيارة", rated: "قيّمتها ✓", rateTitle: "كيف كانت زيارتك؟", rateComment: "بدك تحكيلنا إشي؟ (اختياري)", sendRating: "إرسال", thanksRating: "شكراً، وصلنا تقييمك",
  now: "هلق", rescheduleTitle: "تغيير الموعد", rescheduleSame: "نفس الحلاق ونفس الخدمات، بس وقت جديد", confirmNewTime: "تأكيد الوقت الجديد",
  // explore
  exploreAll: "الكل", exploreFav: "المفضلة", noFav: "ما في إشي بالمفضلة", noFavHint: "اكبس ♡ على حلاق أو فرع عجبك", follow: "أضف للمفضلة", following: "بالمفضلة",
  bookWith: "احجز معه", bookHere: "احجز بهالفرع", postsN: "صورة", branchWord: "فرع", barberWord: "حلاق", noExplore: "ما في صور لسا",
  // account / auth
  signInTitle: "أهلاً فيك", signInSub: "دخول بدون كلمة سر: رقمك، وبنبعتلك رمز على إيميلك.",
  phone: "رقم التلفون", email: "الإيميل", name: "الاسم", continue: "متابعة", sendCode: "ابعت الرمز", createAccount: "إنشاء حساب",
  needEmail: "اكتب إيميلك لنبعتلك رمز الدخول", fixEmail: "صحّح إيميلك ونبعتلك رمز جديد", newAccount: "أول مرة؟ كمّل بياناتك",
  codeSentTo: "بعتنا رمز من 6 أرقام على", confirm: "تأكيد", resend: "ابعت الرمز من جديد", wrongEmail: "الإيميل غلط؟", changeNumber: "غيّر الرقم",
  didYouMean: "قصدك", errPhone: "اكتب رقم تلفون صحيح", errEmail: "اكتب إيميل صحيح", errName: "اكتب اسمك", errCode: "اكتب الرمز كامل (6 أرقام)",
  consent: "موافق على سياسة الخصوصية والشروط", consentReq: "لازم توافق على سياسة الخصوصية", marketing: "بدي أوصلني عروض الصالون", readPolicy: "اقرأ السياسة",
  points: "نقطة", visits: "زيارة", spent: "صرفت", vip: "VIP", vipYou: "إنت VIP ✦", vipLeft: "باقي لـ VIP", vipVisitsLeft: "زيارات", vipOr: "أو",
  memberSince: "معنا من", favBarber: "حلاقك المفضل",
  verifyTitle: "أكّد حسابك", verifyEmail: "إيميلك مش متأكد", verifyPhone: "رقمك مش متأكد", codeHint: "اكتب الرمز اللي وصلك",
  myInfo: "بياناتي", editInfo: "تعديل بياناتي", saved: "انحفظ", emailChangeNote: "إذا غيّرت الإيميل لازم تأكده من جديد",
  notifications: "الإشعارات", noNotifs: "ما في إشعارات", offers: "العروض", noOffers: "ما في عروض هلق", validUntil: "لغاية",
  language: "اللغة", appearance: "الشكل", dark: "داكن", light: "فاتح", privacy: "الخصوصية والشروط", terms: "الشروط",
  myData: "بياناتي", exportData: "تنزيل بياناتي", deleteAccount: "طلب حذف الحساب", deleteQ: "بدك نحذف حسابك وبياناتك؟ الصالون بيراجع الطلب وبيتواصل معك.", deleteSent: "انبعت طلب الحذف", deletePending: "طلب الحذف عم ينراجع",
  logout: "تسجيل الخروج", logoutQ: "متأكد بدك تطلع؟",
  statBookings: "حجز", statDone: "مكتمل", statNext: "جاي",
  branchesTitle: "الفروع", current: "فرعك الحالي", switchTo: "انتقل لهالفرع",
};
type Dict = Record<keyof typeof ar, string>;

const en: Partial<Dict> = {
  tabHome: "Home", tabBook: "Book", tabBookings: "Bookings", tabExplore: "Explore", tabAccount: "Account",
  offline: "You're offline — reconnecting…", close: "Close", back: "Back", next: "Next", done: "Done", cancel: "Cancel", save: "Save", retry: "Try again",
  loading: "One moment…", errNetwork: "Couldn't reach the salon. Check your connection and try again.", errGeneric: "Something went wrong, please try again.",
  min: "min", minutes: "minutes", langSwitch: "عربي",
  hello: "Hi", guestHello: "Welcome", openNow: "Open now", closedNow: "Closed now", closesAt: "closes", opensAt: "opens",
  bookNow: "Book a visit", homeVisit: "Home visit", call: "Call", directions: "Directions",
  nextVisit: "Your next visit", reschedule: "Reschedule", cancelBooking: "Cancel",
  services: "Services", photos: "Photos", team: "Team", info: "Info", about: "About", hours: "Opening hours", amenities: "Amenities", followUs: "Follow us", closed: "Closed",
  noServices: "No services listed", noPhotos: "No photos yet", noTeam: "No barbers", bookThis: "Book", added: "Added", allBranches: "Branches", changeBranch: "Change branch", yourBranch: "Your branch",
  homeVisitPitch: "A barber comes to you", homeVisitPitchSub: "Pick your location and we'll price the trip", offersTitle: "Offers for you",
  where: "Where should we meet?", atSalon: "At the salon", atHome: "At home", atHomeSub: "The barber comes to you, plus a trip fee",
  stepPlace: "Place", stepAddress: "Address", stepServices: "Services", stepBarber: "Barber", stepTime: "Time", stepFirst: "First visit?", stepAccount: "Account", stepConfirm: "Confirm",
  all: "All", anyBarber: "Any available", pickDate: "Pick a day", noSlots: "No free times this day", noSlotsHint: "Try another day or barber",
  slotGone: "That time was just taken, please pick another", firstQ: "Is this your first visit to Shadi Saloon?", firstYes: "Yes, first time", firstYesSub: "We'll let your barber know", firstNo: "No, I've been before", firstNoSub: "Welcome back",
  confirmBooking: "Confirm booking", total: "Total", servicesTotal: "Services", travelFee: "Trip fee", estTotal: "Estimated total", travelNote: "The trip fee is an estimate, finalised at the salon.",
  policy: "Cancellation policy", policyFree: "You can cancel or reschedule from the app before your visit.", policyRestricted: "To cancel or reschedule, contact the branch.",
  leaveQ: "Leave this booking? Your choices will be lost.", useMyLocation: "Use my location", mapHint: "Or tap the map to set your exact spot", locating: "Finding you…", resolving: "Getting the address…", locError: "Couldn't get your location. Allow location or tap the map.",
  kmAway: "km from the branch", perKm: "per km", homeOff: "Home visits aren't available right now", homeOnlyServices: "Services available at home, at home prices",
  booked: "You're booked ✓", seeYou: "See you soon", ref: "Booking ref", branch: "Branch", barber: "Barber", time: "Time", addCalendar: "Add to calendar", rateGoogle: "Enjoying us? Rate us on Google", notNow: "Not now", toMyBookings: "My bookings",
  upcoming: "Upcoming", past: "Past", noUpcoming: "No upcoming visits", noPast: "No past visits", bookFirst: "Book your first visit", signInToSee: "Sign in to see your bookings", signIn: "Sign in",
  st_upcoming: "Upcoming", st_completed: "Completed", st_cancelled: "Cancelled", st_no_show: "Missed", st_past: "Past",
  cancelQ: "Cancel this visit?", cancelled: "Visit cancelled", rescheduled: "Visit rescheduled", bookAgain: "Book again",
  rate: "Rate visit", rated: "Rated ✓", rateTitle: "How was your visit?", rateComment: "Anything to tell us? (optional)", sendRating: "Send", thanksRating: "Thanks, we got your rating",
  now: "Now", rescheduleTitle: "Reschedule", rescheduleSame: "Same barber and services, new time", confirmNewTime: "Confirm new time",
  exploreAll: "All", exploreFav: "Favorites", noFav: "No favorites yet", noFavHint: "Tap ♡ on a barber or branch you like", follow: "Add to favorites", following: "In favorites",
  bookWith: "Book with them", bookHere: "Book here", postsN: "photos", branchWord: "Branch", barberWord: "Barber", noExplore: "No photos yet",
  signInTitle: "Welcome", signInSub: "No password: your number, and we email you a code.", phone: "Phone number", email: "Email", name: "Name", continue: "Continue", sendCode: "Send code", createAccount: "Create account",
  needEmail: "Enter your email to get a sign-in code", fixEmail: "Fix your email and we'll send a new code", newAccount: "New here? Finish your details",
  codeSentTo: "We sent a 6-digit code to", confirm: "Confirm", resend: "Resend code", wrongEmail: "Wrong email?", changeNumber: "Change number",
  didYouMean: "Did you mean", errPhone: "Enter a valid phone number", errEmail: "Enter a valid email", errName: "Enter your name", errCode: "Enter the full 6-digit code",
  consent: "I agree to the privacy policy and terms", consentReq: "Please accept the privacy policy", marketing: "Send me the salon's offers", readPolicy: "Read policy",
  points: "points", visits: "visits", spent: "spent", vip: "VIP", vipYou: "You're VIP ✦", vipLeft: "To VIP", vipVisitsLeft: "visits", vipOr: "or",
  memberSince: "Member since", favBarber: "Your barber", verifyTitle: "Confirm your account", verifyEmail: "Email not confirmed", verifyPhone: "Phone not confirmed", codeHint: "Enter the code you received",
  myInfo: "My details", editInfo: "Edit details", saved: "Saved", emailChangeNote: "A new email needs confirming again",
  notifications: "Notifications", noNotifs: "No notifications", offers: "Offers", noOffers: "No offers right now", validUntil: "until",
  language: "Language", appearance: "Appearance", dark: "Dark", light: "Light", privacy: "Privacy & terms", terms: "Terms",
  myData: "My data", exportData: "Download my data", deleteAccount: "Request account deletion", deleteQ: "Delete your account and data? The salon reviews the request and contacts you.", deleteSent: "Deletion request sent", deletePending: "Deletion request under review",
  logout: "Sign out", logoutQ: "Sign out?", statBookings: "bookings", statDone: "done", statNext: "upcoming",
  branchesTitle: "Branches", current: "Your current branch", switchTo: "Switch to this branch",
};

export type TKey = keyof typeof ar;
export const dict: Record<Lang, Partial<Dict>> = { ar, en };
export function translate(lang: Lang, k: TKey) {
  return dict[lang][k] ?? ar[k];
}
