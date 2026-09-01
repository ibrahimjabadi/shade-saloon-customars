import { useEffect, useState } from "react";
import { useAppStore } from "../../store/appStore";
import { useTranslation } from "../../hooks/useTranslation";
import { SkeletonBookingCards } from "../shell/Skeletons";
import { BookingActionErrorBanner, BookingCard } from "./BookingCard";
import { displayError } from "../../utils/errorDisplay";

// Same status fallback BookingCard itself uses when the backend doesn't send
// a status (older bookings) — kept in one place so both stay in sync.
function bookingIsUpcoming(startMs: number, status: string | undefined, now: number): boolean {
  const s = status || (startMs < now ? "completed" : "upcoming");
  return s === "upcoming";
}

export function BookingsView() {
  const { tr } = useTranslation();
  const account = useAppStore((s) => s.account);
  const myBookings = useAppStore((s) => s.myBookings);
  const loading = useAppStore((s) => s.myBookingsLoading);
  const error = useAppStore((s) => s.myBookingsError);
  const loadMyBookings = useAppStore((s) => s.loadMyBookings);
  const setTab = useAppStore((s) => s.setTab);
  const [bookingsTab, setBookingsTab] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    if (account && myBookings === null && !loading) void loadMyBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  if (!account) {
    return (
      <div className="empty-state">
        <p>{tr("myBookingsLoginPrompt")}</p>
        <button className="btn gold" style={{ width: "auto", marginTop: 10 }} onClick={() => setTab("profile")}>
          {tr("goToProfile")}
        </button>
      </div>
    );
  }

  if (loading && !myBookings) return <SkeletonBookingCards count={3} />;

  if (error) {
    return (
      <div className="empty-state">
        <p>{displayError(error, tr)}</p>
      </div>
    );
  }

  const list = myBookings || [];
  if (!list.length) {
    return (
      <div className="empty-state">
        <p>{tr("myBookingsEmpty")}</p>
        <p className="muted">{tr("myBookingsEmptyHint")}</p>
      </div>
    );
  }

  const now = Date.now();
  const shown = list.filter((bk) => bookingIsUpcoming(new Date(bk.start).getTime(), bk.status, now) === (bookingsTab === "upcoming"));

  return (
    <>
      <BookingActionErrorBanner />
      <div className="home-tabs" style={{ position: "static" }}>
        <button className={`home-tab ${bookingsTab === "upcoming" ? "active" : ""}`} onClick={() => setBookingsTab("upcoming")}>
          {tr("bookingsTabUpcoming")}
        </button>
        <button className={`home-tab ${bookingsTab === "past" ? "active" : ""}`} onClick={() => setBookingsTab("past")}>
          {tr("bookingsTabPast")}
        </button>
      </div>
      {shown.length ? (
        shown.map((bk) => <BookingCard key={bk.id} booking={bk} now={now} />)
      ) : (
        <p className="muted" style={{ textAlign: "center", padding: "24px 0" }}>
          {tr("myBookingsEmptyTab")}
        </p>
      )}
    </>
  );
}
