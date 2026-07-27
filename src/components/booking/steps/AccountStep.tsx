import { useAppStore } from "../../../store/appStore";
import { AccountForm } from "../../profile/AccountForm";

export function AccountStep() {
  const jumpToConfirmStep = useAppStore((s) => s.jumpToConfirmStep);
  return <AccountForm onRegistered={jumpToConfirmStep} />;
}
