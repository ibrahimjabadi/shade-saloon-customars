import { useEffect, useState } from "react";
import { Icon } from "../components/Icon";
import { Empty, Loading, Sheet } from "../components/ui";
import { api } from "../lib/api";
import { whenLabel } from "../lib/format";
import type { Notif } from "../lib/types";
import { useApp, useT } from "../store/app";

const ICON: Record<Notif["kind"], string> = { reminder: "clock", rate: "star", cancelled: "x", offer: "gift" };

/** The customer's feed: visit coming up, visit to rate, a visit the salon
 * cancelled, offers. Opening it marks everything seen. */
export function Notifications({ onClose }: { onClose: () => void }) {
  const t = useT();
  const { lang, bookings, loadBookings, open, go } = useApp();
  const [items, setItems] = useState<Notif[] | null>(null);
  useEffect(() => {
    api<{ items: Notif[] }>("/api/customer/notifications")
      .then((r) => {
        setItems(r.items);
        if (r.items.some((x) => x.unread))
          api("/api/customer/notifications/seen", { body: {} })
            .then(() => useApp.setState({ unread: 0 }))
            .catch(() => {});
      })
      .catch(() => setItems([]));
    if (!bookings) void loadBookings();
  }, [bookings, loadBookings]);

  function act(n: Notif) {
    const b = (bookings || []).find((x) => x.id === n.bookingId);
    onClose();
    if (n.kind === "rate" && b) open({ kind: "review", booking: b });
    else if (n.kind === "cancelled")
      open({ kind: "book", mode: "salon", barberId: b?.barberId, serviceId: b?.serviceIds?.[0] });
    else if (n.kind === "offer") open({ kind: "book" });
    else go("bookings");
  }

  return (
    <Sheet title={t("notifications")} onClose={onClose}>
      {!items ? (
        <Loading />
      ) : !items.length ? (
        <Empty icon="bell" title={t("noNotifs")} />
      ) : (
        <div className="group">
          {items.map((n) => (
            <button key={n.id} className={`notif ${n.unread ? "unread" : ""} k-${n.kind}`} onClick={() => act(n)}>
              <span className="ni">
                <Icon name={ICON[n.kind]} size={18} />
              </span>
              <span className="grow" style={{ minWidth: 0 }}>
                <b>{n.title}</b>
                <small>{n.body}</small>
                {n.start && <em className="num">{whenLabel(n.start, lang)}</em>}
              </span>
              {n.unread && <i className="dot" />}
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}
