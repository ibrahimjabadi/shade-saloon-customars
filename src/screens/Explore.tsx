import { useMemo, useState } from "react";
import { Icon } from "../components/Icon";
import { Avatar, Empty, Sheet } from "../components/ui";
import { media } from "../lib/api";
import { branchBarbers } from "../lib/salon";
import type { Photo } from "../lib/types";
import { useApp, useT } from "../store/app";

type Owner = { type: "barber" | "branch"; id: string; name: string; photo?: string; branchId: string };
type Post = { key: string; owner: Owner; photo: Photo };

// Everyone's work in one feed: branch galleries and barbers' portfolio
// photos. Tapping one opens its owner; ♡ keeps them in favorites (saved
// on the account when signed in).
export function Explore() {
  const t = useT();
  const { branches, barbers, favorites } = useApp();
  const [filter, setFilter] = useState<"all" | "fav">("all");
  const [open, setOpen] = useState<Owner | null>(null);

  const posts = useMemo<Post[]>(() => {
    const out: Post[] = [];
    branches.forEach((b) => (b.galleryPhotos || []).forEach((p, i) => out.push({ key: `br:${b.id}:${i}`, owner: { type: "branch", id: b.id, name: b.name, photo: b.galleryPhotos?.[0]?.url, branchId: b.id }, photo: p })));
    barbers.forEach((b) => (b.portfolioPhotos || []).forEach((p, i) => out.push({ key: `ba:${b.id}:${i}`, owner: { type: "barber", id: b.id, name: b.name, photo: b.photoUrl, branchId: b.branchId }, photo: p })));
    // interleave so one owner doesn't fill the top of the feed
    return out.sort((a, b) => Number(a.key.split(":")[2]) - Number(b.key.split(":")[2]));
  }, [branches, barbers]);
  const shown = filter === "all" ? posts : posts.filter((p) => favorites.includes(`${p.owner.type}:${p.owner.id}`));
  const favPeople = filter === "fav" ? favoriteOwners(favorites, branches, barbers) : [];

  return (
    <>
      <div className="page-head"><h1>{t("tabExplore")}</h1></div>
      <div className="chips" style={{ marginBottom: 14 }}>
        <button className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>{t("exploreAll")}</button>
        <button className={filter === "fav" ? "on" : ""} onClick={() => setFilter("fav")}><Icon name="heart" size={14} /> {t("exploreFav")} {favorites.length > 0 && <span className="num">{favorites.length}</span>}</button>
      </div>

      {filter === "all" && (
        <div className="people">{branchBarbers(barbers, useApp.getState().branchId).map((b) => (
          <button key={b.id} onClick={() => setOpen({ type: "barber", id: b.id, name: b.name, photo: b.photoUrl, branchId: b.branchId })}>
            <Avatar name={b.name} url={b.photoUrl} id={b.id} size={58} /><small>{b.name.split(" ")[0]}</small>
          </button>
        ))}</div>
      )}
      {filter === "fav" && favPeople.length > 0 && (
        <div className="people">{favPeople.map((o) => (
          <button key={o.id} onClick={() => setOpen(o)}><Avatar name={o.name} url={o.photo} id={o.id} size={58} /><small>{o.name.split(" ")[0]}</small></button>
        ))}</div>
      )}

      {!shown.length ? (
        filter === "fav" && !favorites.length ? <Empty icon="heart" title={t("noFav")} text={t("noFavHint")} /> : <Empty icon="star" title={t("noExplore")} />
      ) : (
        <div className="feed">{shown.map((p) => (
          <button key={p.key} className="tile" onClick={() => setOpen(p.owner)}>
            <img src={media(p.photo.url)} alt={p.photo.caption || ""} loading="lazy" />
            <span className="owner"><Avatar name={p.owner.name} url={p.owner.photo} id={p.owner.id} size={22} />{p.owner.name}</span>
          </button>
        ))}</div>
      )}
      {open && <ProfileSheet type={open.type} id={open.id} onClose={() => setOpen(null)} />}
    </>
  );
}

function favoriteOwners(favs: string[], branches: ReturnType<typeof useApp.getState>["branches"], barbers: ReturnType<typeof useApp.getState>["barbers"]): Owner[] {
  return favs.map((k) => {
    const [type, id] = k.split(":");
    if (type === "barber") { const b = barbers.find((x) => x.id === id); return b && { type: "barber" as const, id, name: b.name, photo: b.photoUrl, branchId: b.branchId }; }
    const b = branches.find((x) => x.id === id);
    return b && { type: "branch" as const, id, name: b.name, photo: b.galleryPhotos?.[0]?.url, branchId: b.id };
  }).filter(Boolean) as Owner[];
}

/** A barber's or branch's page: photo, who they are, their work, ♡, book. */
export function ProfileSheet({ type, id, onClose }: { type: "barber" | "branch"; id: string; onClose: () => void }) {
  const t = useT();
  const { branches, barbers, favorites, toggleFavorite, open, setBranch, lang } = useApp();
  const [big, setBig] = useState<string | null>(null);
  const barber = type === "barber" ? barbers.find((b) => b.id === id) : undefined;
  const branch = type === "branch" ? branches.find((b) => b.id === id) : branches.find((b) => b.id === barber?.branchId);
  const name = barber?.name || branch?.name || "";
  const photos = (barber ? barber.portfolioPhotos : branch?.galleryPhotos) || [];
  const key = `${type}:${id}`;
  const fav = favorites.includes(key);
  const book = () => {
    if (branch) setBranch(branch.id);
    onClose();
    open({ kind: "book", mode: "salon", barberId: barber?.id, branchId: branch?.id });
  };
  return (
    <Sheet title={name} sub={type === "barber" ? `${barber?.title || t("barberWord")}${branch ? ` · ${branch.name}` : ""}` : t("branchWord")} onClose={onClose}
      footer={<><button className={`btn ghost ${fav ? "faved" : ""}`} onClick={() => toggleFavorite(key)} aria-pressed={fav}><Icon name="heart" size={18} />{fav ? t("following") : t("follow")}</button><button className="btn gold grow" onClick={book}>{type === "barber" ? t("bookWith") : t("bookHere")}</button></>}>
      <div className="profile-top">
        <Avatar name={name} url={barber?.photoUrl || branch?.galleryPhotos?.[0]?.url} id={id} size={92} />
        <div><b className="num">{photos.length}</b> <small className="muted">{t("postsN")}</small></div>
        {type === "branch" && branch && (lang === "ar" ? branch.descriptionAr || branch.description : branch.description) && <p className="muted">{lang === "ar" ? branch.descriptionAr || branch.description : branch.description}</p>}
      </div>
      {photos.length ? (
        <div className="photo-grid">{photos.map((p, i) => <button key={i} onClick={() => setBig(p.url)}><img src={media(p.url)} alt={p.caption || ""} loading="lazy" /></button>)}</div>
      ) : <Empty icon="star" title={t("noPhotos")} />}
      {big && <div className="lightbox" onClick={() => setBig(null)}><img src={media(big)} alt="" /></div>}
    </Sheet>
  );
}
