import type { Barber, Branch } from "../api/types";
import { resolveMediaUrl } from "./media";

export type ProfileType = "branch" | "barber";

export interface ExplorePost {
  id: string;
  ownerType: ProfileType;
  ownerId: string;
  ownerName: string;
  ownerAvatarUrl?: string;
  branchId: string; // for barbers: their branch; for branches: themselves
  imageUrl: string;
  caption?: string;
}

/** No backend "post" or "follow" concept exists yet (see the social API
 * contract handed off separately) — this synthesizes an Explore grid purely
 * from photos already present in /api/bootstrap: each branch's
 * galleryPhotos and each barber's portfolioPhotos (barbers are a flat
 * top-level list, not nested under branch — see utils/branchCatalog.ts for
 * why). Real per-post captions/likes/timestamps don't exist in this data,
 * so none are invented here; this is a photo grid to browse and reach a
 * profile, not a feed with fabricated social-proof numbers. */
export function buildExplorePosts(branches: Branch[], barbers: Barber[]): ExplorePost[] {
  const posts: ExplorePost[] = [];
  for (const branch of branches) {
    (branch.galleryPhotos || []).forEach((photo, i) => {
      posts.push({
        id: `branch:${branch.id}:${i}`,
        ownerType: "branch",
        ownerId: branch.id,
        ownerName: branch.name,
        ownerAvatarUrl: resolveMediaUrl(branch.galleryPhotos?.[0]?.url),
        branchId: branch.id,
        imageUrl: resolveMediaUrl(photo.url),
        caption: photo.caption,
      });
    });
  }
  for (const barber of barbers) {
    (barber.portfolioPhotos || []).forEach((photo, i) => {
      posts.push({
        id: `barber:${barber.id}:${i}`,
        ownerType: "barber",
        ownerId: barber.id,
        ownerName: barber.name,
        ownerAvatarUrl: resolveMediaUrl(barber.photoUrl),
        branchId: barber.branchId,
        imageUrl: resolveMediaUrl(photo.url),
        caption: photo.caption,
      });
    });
  }
  return posts;
}

export function favoriteKey(type: ProfileType, id: string): string {
  return `${type}:${id}`;
}
