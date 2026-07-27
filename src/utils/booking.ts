import type { Service } from "../api/types";

export function serviceName(s: Service, lang: "ar" | "en"): string {
  return lang === "ar" ? s.nameAr || s.name : s.name;
}

export function resolveSelectedServices(services: Service[], ids: string[]): Service[] {
  return ids.map((id) => services.find((s) => s.id === id)).filter((s): s is Service => Boolean(s));
}

export function totalPrice(services: Service[]): number {
  return services.reduce((sum, s) => sum + s.price, 0);
}

export function totalDuration(services: Service[]): number {
  return services.reduce((sum, s) => sum + s.duration, 0);
}
