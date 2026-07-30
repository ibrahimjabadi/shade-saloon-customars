import { useTranslation } from "../../hooks/useTranslation";
import { AddressPicker } from "./AddressPicker";
import { HVServicesStep } from "./steps/HVServicesStep";
import { HVBarberStep } from "./steps/HVBarberStep";
import { HVTimeStep } from "./steps/HVTimeStep";
import { HVConfirmStep } from "./steps/HVConfirmStep";
import { AccountForm } from "../profile/AccountForm";
import { SuccessScreen } from "../booking/SuccessScreen";
import { useHomeVisitWizard } from "./useHomeVisitWizard";

export function HomeVisitWizard() {
  const { tr } = useTranslation();
  const wizard = useHomeVisitWizard();
  const { state } = wizard;

  if (state.success) return <SuccessScreen booking={state.success} onDone={wizard.reset} />;

  const titles: Record<number, string> = {
    [wizard.STEP_ADDRESS]: tr("address"),
    [wizard.STEP_SERVICES]: tr("services"),
    [wizard.STEP_BARBER]: tr("barber"),
    [wizard.STEP_TIME]: tr("time"),
    [wizard.STEP_ACCOUNT]: tr("account"),
    [wizard.STEP_CONFIRM]: tr("details"),
  };
  const stepsList = wizard.stepsList();
  const pos = stepsList.indexOf(state.step);
  const isLast = pos === stepsList.length - 1;

  return (
    <div className="card">
      <h3 style={{ marginBottom: 4 }}>{titles[state.step]}</h3>
      <div className="booking-progress" style={{ padding: "0 0 12px" }}>
        {stepsList.map((_, i) => (
          <div key={i} className={`booking-progress-dot ${i < pos ? "done" : ""} ${i === pos ? "active" : ""}`} />
        ))}
      </div>

      {state.step === wizard.STEP_ADDRESS && <AddressPicker value={state.location} onChange={wizard.setLocation} />}
      {state.step === wizard.STEP_SERVICES && <HVServicesStep wizard={wizard} />}
      {state.step === wizard.STEP_BARBER && <HVBarberStep wizard={wizard} />}
      {state.step === wizard.STEP_TIME && <HVTimeStep wizard={wizard} />}
      {state.step === wizard.STEP_ACCOUNT && <AccountForm onRegistered={wizard.jumpToConfirm} />}
      {state.step === wizard.STEP_CONFIRM && <HVConfirmStep wizard={wizard} />}

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        {pos > 0 && state.step !== wizard.STEP_ACCOUNT && (
          <button className="btn secondary" style={{ width: "auto" }} onClick={wizard.prev}>
            {tr("back")}
          </button>
        )}
        {!isLast && state.step !== wizard.STEP_ACCOUNT && (
          <button className="btn gold" style={{ width: "auto" }} disabled={!wizard.canAdvance()} onClick={wizard.next}>
            {tr("next")}
          </button>
        )}
        {isLast && (
          <button className="btn gold" style={{ width: "auto" }} disabled={state.submitting} onClick={() => void wizard.submit()}>
            {state.submitting ? tr("loading") : tr("confirmBooking")}
          </button>
        )}
      </div>
    </div>
  );
}
