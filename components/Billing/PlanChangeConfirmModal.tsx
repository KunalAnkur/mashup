"use client";

import { useEffect } from "react";
import { LuCrown } from "react-icons/lu";
import Modal, {
  ModalConfirmContent,
  modalConfirmSurfaceClass,
} from "@/components/UI/Modal";
import {
  useLazyPreviewChangePlanQuery,
  useChangePlanMutation,
} from "@/lib/store/api/billingApi";
import { formatPlanPrice } from "@/utils/subscription";
import { getApiErrorMessage } from "@/utils/apiError";
import { useTranslations } from "@/i18n/I18nProvider";
import { showError, showSuccess } from "@/utils/toast";

type Props = {
  open: boolean;
  onClose: () => void;
  targetPlanSlug: string | null;
  targetPlanName: string;
  onChanged?: () => void;
};

function formatDate(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function PlanChangeConfirmModal({
  open,
  onClose,
  targetPlanSlug,
  targetPlanName,
  onChanged,
}: Props) {
  const t = useTranslations("planChange");
  const [
    fetchPreview,
    { data: previewResponse, isFetching: isPreviewLoading, error: previewError },
  ] = useLazyPreviewChangePlanQuery();
  const [changePlan, { isLoading: isChanging }] = useChangePlanMutation();

  useEffect(() => {
    if (open && targetPlanSlug) {
      fetchPreview(targetPlanSlug);
    }
  }, [open, targetPlanSlug, fetchPreview]);

  const preview = previewResponse?.data;

  const handleConfirm = async () => {
    if (!targetPlanSlug) return;

    try {
      await changePlan(targetPlanSlug).unwrap();
      onClose();
      showSuccess(
        preview?.direction === "downgrade" ? t("downgradeStarted") : t("upgradeStarted"),
      );
      onChanged?.();
    } catch (err) {
      showError(t("changeFailedTitle"), getApiErrorMessage(err, t("changeFailedDefault")));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeOnBackdropClick={!isChanging}
      closeOnEscape={!isChanging}
      overlayClassName="z-[99999]"
      panelClassName={modalConfirmSurfaceClass}
    >
      {isPreviewLoading ? (
        <div className="px-4 py-8 text-center text-sm text-white/56 md:px-5">
          {t("loadingPreview")}
        </div>
      ) : previewError || !preview ? (
        <div className="px-4 py-8 text-center md:px-5">
          <p className="text-sm text-white/72">
            {getApiErrorMessage(previewError, t("changeFailedDefault"))}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 text-sm font-semibold text-rose-300 hover:text-rose-200"
          >
            {t("keepCurrentPlan")}
          </button>
        </div>
      ) : (
        <ModalConfirmContent
          icon={<LuCrown size={18} className="text-current" />}
          title={
            preview.direction === "upgrade"
              ? t("upgradeTitle", { plan: targetPlanName })
              : t("downgradeTitle", { plan: targetPlanName })
          }
          message={
            preview.direction === "upgrade"
              ? t("upgradeMessage", {
                  amount: formatPlanPrice(preview.amountDueToday, preview.currency),
                  date: formatDate(preview.nextBillingDate),
                })
              : t("downgradeMessage", {
                  plan: targetPlanName,
                  date: formatDate(preview.nextBillingDate),
                })
          }
          cancelLabel={t("keepCurrentPlan")}
          confirmLabel={isChanging ? t("confirming") : t("confirmChange")}
          onCancel={onClose}
          onConfirm={handleConfirm}
          confirmDisabled={isChanging}
        />
      )}
    </Modal>
  );
}
