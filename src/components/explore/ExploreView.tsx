import { useMemo, useState } from "react";
import { useAppStore } from "../../store/appStore";
import { useTranslation } from "../../hooks/useTranslation";
import { buildExplorePosts, favoriteKey, type ProfileType } from "../../utils/explorePosts";
import { ProfileModal } from "./ProfileModal";

type Filter = "all" | "favorites";

export function ExploreView() {
  const { tr } = useTranslation();
  const branches = useAppStore((s) => s.branches);
  const favorites = useAppStore((s) => s.favorites);
  const [filter, setFilter] = useState<Filter>("all");
  const [openProfile, setOpenProfile] = useState<{ type: ProfileType; id: string } | null>(null);

  const posts = useMemo(() => buildExplorePosts(branches), [branches]);
  const visible =
    filter === "all" ? posts : posts.filter((p) => favorites.includes(favoriteKey(p.ownerType, p.ownerId)));

  return (
    <>
      <div className="chips" style={{ position: "static", marginBottom: 12 }}>
        <button className={`chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
          {tr("exploreAll")}
        </button>
        <button className={`chip ${filter === "favorites" ? "active" : ""}`} onClick={() => setFilter("favorites")}>
          {tr("exploreFavorites")}
        </button>
      </div>

      {filter === "favorites" && !visible.length ? (
        <div className="empty-state">
          <p>{tr("exploreFavoritesEmpty")}</p>
          <p className="muted">{tr("exploreFavoritesEmptyHint")}</p>
        </div>
      ) : !visible.length ? (
        <div className="empty-state">
          <p>{tr("exploreEmpty")}</p>
        </div>
      ) : (
        <div className="explore-grid">
          {visible.map((post) => (
            <div
              className="explore-tile"
              key={post.id}
              onClick={() => setOpenProfile({ type: post.ownerType, id: post.ownerId })}
            >
              <img src={post.imageUrl} alt={post.caption || ""} loading="lazy" />
              <span className="owner-tag">{post.ownerName}</span>
            </div>
          ))}
        </div>
      )}

      <p className="muted" style={{ fontSize: 12, marginTop: 14, textAlign: "center" }}>
        {tr("favoritesLocalNote")}
      </p>

      {openProfile && (
        <ProfileModal type={openProfile.type} id={openProfile.id} onClose={() => setOpenProfile(null)} />
      )}
    </>
  );
}
