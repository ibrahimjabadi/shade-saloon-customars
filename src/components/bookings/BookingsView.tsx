import { useEffect } from "react";
import { useAppStore } from "../../store/appStore";
import { useTranslation } from "../../hooks/useTranslation";
import { SkeletonBookingCards } from "../shell/Skeletons";
import { BookingActionErrorBanner, BookingCard } from "./BookingCard";
import { displayError } from "../../utils/errorDisplay";

export function BookingsView() {
  const { tr } = useTranslation();
  const account = useAppStore((s) => s.account);
  const myBookings = useAppStore((s) => s.myBookings);
  const loading = useAppStore((s) => s.myBookingsLoading);
  const error = useAppStore((s) => s.myBookingsError);
  const loadMyBookings = useAppStore((s) => s.loadMyBookings);
  const setTab = useAppStore((s) => s.setTab);

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
  return (
    <>
      <BookingActionErrorBanner />
      {list.map((bk) => (
        <BookingCard key={bk.id} booking={bk} now={now} />
      ))}
    </>
  );
}
