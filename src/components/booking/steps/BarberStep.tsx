import { useAppStore } from "../../../store/appStore";
import { resolveMediaUrl } from "../../../utils/media";
import { avatarColorFor } from "../../../utils/avatarColor";

export function BarberStep() {
  const branchId = useAppStore((s) => s.branchId);
  const barbers = useAppStore((s) => s.barbers.filter((b) => b.branchId === branchId));
  const barberId = useAppStore((s) => s.booking?.barberId);
  const setBkBarber = useAppStore((s) => s.setBkBarber);

  return (
    <div className="grid">
      {barbers.map((b) => (
        <div
          key={b.id}
          className={`item barber-card ${barberId === b.id ? "selected" : ""}`}
          onClick={() => setBkBarber(b.id)}
        >
          <div
            className="barber-avatar"
            style={
              b.photoUrl
                ? { backgroundImage: `url('${resolveMediaUrl(b.photoUrl)}')` }
                : { backgroundColor: avatarColorFor(b.id), color: "#fff" }
            }
          >
            {b.photoUrl ? "" : (b.name || "?").trim()[0] || "?"}
          </div>
          <div>
            <strong>{b.name}</strong>
            <div className="meta">{b.title || ""}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
