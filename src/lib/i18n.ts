// Every text in the app, Arabic first. t("key") picks the current language;
// a key missing from English falls back to Arabic.
export type Lang = "ar" | "en";

const ar = {
  // shell
  tabHome: "الرئيسية", tabBook: "احجز", tabBookings: "حجوزاتي", tabExplore: "استكشف", tabAccount: "حسابي",
  offline: "لا يوجد اتصال بالإنترنت — جارٍ إعادة المحاولة",
  close: "إغلاق", back: "رجوع", next: "التالي", done: "حسنًا", cancel: "إلغاء", save: "حفظ", retry: "إعادة المحاولة",
  loading: "يرجى الانتظار…", errNetwork: "تعذّر الاتصال بالصالون. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.", errGeneric: "حدث خطأ، يرجى المحاولة مرة أخرى.",
  min: "د", minutes: "دقيقة", langSwitch: "English",
  // home
  hello: "أهلًا", guestHello: "أهلًا بك", openNow: "مفتوح الآن", closedNow: "مغلق الآن", closesAt: "يُغلق", opensAt: "يُفتح",
  bookNow: "احجز موعد", homeVisit: "زيارة منزلية", call: "اتصل", directions: "الاتجاهات",
  nextVisit: "موعدك القادم", reschedule: "تغيير الموعد", cancelBooking: "إلغاء",
  services: "الخدمات", photos: "الصور", team: "الفريق", info: "معلومات",
  about: "عن الفرع", hours: "ساعات العمل", amenities: "المميزات", followUs: "تابعنا", closed: "مغلق",
  noServices: "لا توجد خدمات معروضة", noPhotos: "لا توجد صور بعد", noTeam: "لا يوجد حلاقون",
  bookThis: "احجز", added: "مضافة", allBranches: "الفروع", changeBranch: "تغيير الفرع", yourBranch: "فرعك",
  homeVisitPitch: "الحلاق يأتيك إلى المنزل", homeVisitPitchSub: "اختر موقعك وسنحسب لك أجرة التوصيل",
  offersTitle: "عروض لك",
  // booking
  where: "أين تريد موعدك؟", atSalon: "في الصالون", atHome: "في المنزل", atHomeSub: "الحلاق يأتيك، مع أجرة التوصيل",
  stepPlace: "المكان", stepAddress: "العنوان", stepServices: "الخدمات", stepBarber: "الحلاق", stepTime: "الوقت", stepFirst: "أول زيارة؟", stepAccount: "حسابك", stepConfirm: "التأكيد",
  all: "الكل", anyBarber: "أي حلاق متاح", pickDate: "اختر يومًا", noSlots: "لا توجد أوقات متاحة في هذا اليوم", noSlotsHint: "جرّب يومًا آخر أو حلاقًا آخر",
  slotGone: "الوقت الذي اخترته حُجز للتو، يرجى اختيار وقت آخر", firstQ: "هل هذه زيارتك الأولى لشادي صالون؟", firstYes: "نعم، المرة الأولى", firstYesSub: "سنُعلم الحلاق بذلك", firstNo: "لا، زرتكم من قبل", firstNoSub: "أهلًا بعودتك",
  confirmBooking: "تأكيد الحجز", total: "المجموع", servicesTotal: "الخدمات", travelFee: "أجرة التوصيل", estTotal: "الإجمالي التقديري", travelNote: "أجرة التوصيل تقديرية، وتُحسب نهائيًا في الصالون.",
  policy: "سياسة الإلغاء", policyFree: "يمكنك إلغاء موعدك أو تغييره من التطبيق قبل حلوله.", policyRestricted: "للإلغاء أو التغيير يرجى التواصل مع الفرع.",
  leaveQ: "هل تريد الخروج من الحجز؟ ستُفقد اختياراتك.",
  useMyLocation: "استخدم موقعي", mapHint: "أو اضغط على الخريطة لتحديد موقعك بدقة", locating: "جارٍ تحديد موقعك…", resolving: "جارٍ جلب العنوان…", locError: "تعذّر تحديد موقعك. اسمح بالوصول إلى الموقع أو حدّد مكانك على الخريطة.",
  kmAway: "كم من الفرع", perKm: "للكيلو", homeOff: "الحجز المنزلي غير متاح حاليًا",
  homeOnlyServices: "الخدمات المتاحة في المنزل، بسعرها المنزلي",
  // success
  booked: "تم حجز موعدك ✓", seeYou: "نراك قريبًا", ref: "رقم الحجز", branch: "الفرع", barber: "الحلاق", time: "الوقت",
  addCalendar: "أضف للتقويم", rateGoogle: "هل أعجبك الصالون؟ قيّمنا على Google", notNow: "ليس الآن", toMyBookings: "حجوزاتي",
  // bookings
  upcoming: "القادمة", past: "السابقة", noUpcoming: "لا توجد لديك مواعيد قادمة", noPast: "لا توجد زيارات سابقة", bookFirst: "احجز موعدك الأول",
  signInToSee: "سجّل الدخول لعرض حجوزاتك", signIn: "تسجيل الدخول",
  st_upcoming: "قادم", st_completed: "مكتمل", st_cancelled: "ملغي", st_no_show: "لم تحضر", st_past: "انتهى",
  cancelQ: "هل أنت متأكد من إلغاء هذا الموعد؟", cancelled: "تم إلغاء الموعد", rescheduled: "تم تغيير الموعد", bookAgain: "احجز الموعد نفسه",
  rate: "قيّم الزيارة", rated: "قيّمتها ✓", rateTitle: "كيف كانت زيارتك؟", rateComment: "هل تود إخبارنا بشيء؟ (اختياري)", sendRating: "إرسال", thanksRating: "شكرًا، وصلنا تقييمك",
  now: "الآن", rescheduleTitle: "تغيير الموعد", rescheduleSame: "الحلاق نفسه والخدمات نفسها، ولكن بوقت جديد", confirmNewTime: "تأكيد الوقت الجديد",
  // explore
  exploreAll: "الكل", exploreFav: "المفضلة", noFav: "لا يوجد شيء في المفضلة", noFavHint: "اضغط ♡ على حلاق أو فرع أعجبك", follow: "أضف للمفضلة", following: "في المفضلة",
  bookWith: "احجز معه", bookHere: "احجز في هذا الفرع", postsN: "صورة", branchWord: "فرع", barberWord: "حلاق", noExplore: "لا توجد صور بعد",
  // account / auth
  signInTitle: "أهلًا بك", signInSub: "دخول دون كلمة مرور: أدخل رقمك، وسنرسل لك رمزًا إلى بريدك الإلكتروني.",
  phone: "رقم الهاتف", email: "البريد الإلكتروني", name: "الاسم", continue: "متابعة", sendCode: "أرسل الرمز", createAccount: "إنشاء حساب",
  needEmail: "أدخل بريدك الإلكتروني لنرسل لك رمز الدخول", fixEmail: "صحّح بريدك الإلكتروني وسنرسل لك رمزًا جديدًا", newAccount: "أول مرة؟ أكمل بياناتك",
  codeSentTo: "أرسلنا رمزًا من 6 أرقام إلى", confirm: "تأكيد", resend: "أعد إرسال الرمز", wrongEmail: "البريد الإلكتروني غير صحيح؟", changeNumber: "تغيير الرقم",
  didYouMean: "هل تقصد", errPhone: "أدخل رقم هاتف صحيحًا", errEmail: "أدخل بريدًا إلكترونيًا صحيحًا", errName: "أدخل اسمك", errCode: "أدخل الرمز كاملًا (6 أرقام)",
  consent: "أوافق على سياسة الخصوصية والشروط", consentReq: "يجب الموافقة على سياسة الخصوصية", marketing: "أرغب في تلقي عروض الصالون", readPolicy: "اقرأ السياسة",
  points: "نقطة", visits: "زيارة", spent: "أنفقت", vip: "VIP", vipYou: "أنت عميل VIP ✦", vipLeft: "المتبقي للوصول إلى VIP", vipVisitsLeft: "زيارات", vipOr: "أو",
  memberSince: "معنا من", favBarber: "حلاقك المفضل",
  verifyTitle: "أكّد حسابك", verifyEmail: "بريدك الإلكتروني غير مؤكد", verifyPhone: "رقمك غير مؤكد", codeHint: "أدخل الرمز الذي وصلك",
  myInfo: "بياناتي", editInfo: "تعديل بياناتي", saved: "تم الحفظ", emailChangeNote: "إذا غيّرت بريدك الإلكتروني فيجب تأكيده من جديد",
  notifications: "الإشعارات", noNotifs: "لا توجد إشعارات", offers: "العروض", noOffers: "لا توجد عروض حاليًا", validUntil: "حتى",
  language: "اللغة", appearance: "الشكل", dark: "داكن", light: "فاتح", privacy: "الخصوصية والشروط", terms: "الشروط",
  myData: "بياناتي", exportData: "تنزيل بياناتي", deleteAccount: "طلب حذف الحساب", deleteQ: "هل تريد حذف حسابك وبياناتك؟ سيراجع الصالون الطلب ويتواصل معك.", deleteSent: "تم إرسال طلب الحذف", deletePending: "طلب الحذف قيد المراجعة",
  logout: "تسجيل الخروج", logoutQ: "هل أنت متأكد من تسجيل الخروج؟",
  statBookings: "حجز", statDone: "مكتمل", statNext: "قادم",
  branchesTitle: "الفروع", current: "فرعك الحالي", switchTo: "الانتقال إلى هذا الفرع",
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
