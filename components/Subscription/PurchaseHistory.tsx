"use client";

import { useMemo, useState } from "react";
import {
  LuArrowDown,
  LuArrowUp,
  LuChevronLeft,
  LuChevronRight,
  LuCrown,
  LuExternalLink,
  LuSearch,
} from "react-icons/lu";

import { useTranslations } from "@/i18n/I18nProvider";
import type { PaymentTransactionSummary } from "@/lib/store/api/billingApi";
import { PaymentStatus } from "@/types/subscriptionTypes";
import { formatPlanPrice } from "@/utils/subscription";
import {
  appPulseSurfaceClass,
  appTransactionStatusBadgeClass,
  appTransactionStatusCompletedClass,
  appTransactionStatusFailedClass,
  appTransactionStatusNeutralClass,
  appTransactionStatusProcessingClass,
  subHistoryCardClass,
  subHistoryCellClass,
  subHistoryEmptyClass,
  subHistoryHeadCellClass,
  subHistoryHeadRowClass,
  subHistoryIconClass,
  subHistoryInvoiceLinkClass,
  subHistoryPagerButtonClass,
  subHistoryPagerClass,
  subHistoryRowClass,
  subHistorySearchInputClass,
  subHistorySearchWrapClass,
  subHistorySelectClass,
  subHistorySortButtonClass,
  subHistoryToolbarClass,
} from "@/components/UI/classTokens";

/**
 * Every charge on the account, searchable and sortable.
 *
 * Filtering runs in the browser on purpose. A person accumulates tens of these, not
 * thousands, and guardian already hands over the whole list in one call — so paging it
 * on the server would cost a round trip per keystroke to solve a problem nobody has.
 * The day somebody has a thousand rows, the sort and filter state here is the same shape
 * a query string would take, and this becomes a fetch.
 */

const PAGE_SIZE = 8;

type SortKey = "date" | "amount";
type StatusFilter = "all" | PaymentStatus;
type DateFilter = "all" | "30d" | "90d" | "year";

const STATUS_CLASS: Record<PaymentStatus, string> = {
  [PaymentStatus.PROCESSING]: appTransactionStatusProcessingClass,
  [PaymentStatus.PENDING]: appTransactionStatusProcessingClass,
  [PaymentStatus.COMPLETED]: appTransactionStatusCompletedClass,
  [PaymentStatus.FAILED]: appTransactionStatusFailedClass,
  [PaymentStatus.REFUNDED]: appTransactionStatusNeutralClass,
};

/**
 * Offered as filters. Pending and processing are deliberately absent — they are a state
 * a charge passes through in seconds, not something anyone goes looking for, and a
 * filter that is empty every time you open it is noise.
 */
const STATUS_OPTIONS: StatusFilter[] = [
  "all",
  PaymentStatus.COMPLETED,
  PaymentStatus.FAILED,
  PaymentStatus.REFUNDED,
];

const DATE_OPTIONS: DateFilter[] = ["all", "30d", "90d", "year"];

const DAY_MS = 24 * 60 * 60 * 1000;

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

function withinRange(value: string, range: DateFilter, now: number): boolean {
  if (range === "all") return true;
  const at = new Date(value).getTime();
  if (Number.isNaN(at)) return false;

  if (range === "year") return new Date(at).getFullYear() === new Date(now).getFullYear();
  return now - at <= (range === "30d" ? 30 : 90) * DAY_MS;
}

export function PurchaseHistory({
  transactions,
  isLoading,
}: {
  transactions: PaymentTransactionSummary[];
  isLoading: boolean;
}) {
  const t = useTranslations("subscription");

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [range, setRange] = useState<DateFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [descending, setDescending] = useState(true);
  const [page, setPage] = useState(0);

  const describe = (tx: PaymentTransactionSummary) => {
    const plan = tx.planName ?? tx.planSlug;
    if (tx.direction === "upgrade") {
      return plan ? t("transactions.upgradeTo", { plan }) : t("transactions.upgrade");
    }
    if (tx.direction === "downgrade") {
      return plan ? t("transactions.downgradeTo", { plan }) : t("transactions.downgrade");
    }
    return plan
      ? t("transactions.newSubscriptionTo", { plan })
      : t("transactions.newSubscription");
  };

  const visible = useMemo(() => {
    const now = Date.now();
    const needle = query.trim().toLowerCase();

    const filtered = transactions.filter((tx) => {
      if (status !== "all" && tx.status !== status) return false;
      if (!withinRange(tx.createdAt, range, now)) return false;
      if (!needle) return true;
      // Searchable by the reference someone would have in front of them — the id from a
      // receipt or an email — and by the plan they bought, since that is what they
      // actually remember.
      return (
        tx.transactionId?.toLowerCase().includes(needle) ||
        (tx.planName ?? tx.planSlug ?? "").toLowerCase().includes(needle)
      );
    });

    return [...filtered].sort((a, b) => {
      const delta =
        sortKey === "amount"
          ? a.amount - b.amount
          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return descending ? -delta : delta;
    });
  }, [transactions, query, status, range, sortKey, descending]);

  // Filtering to fewer rows than the current page would otherwise leave the table blank
  // with a pager saying page 3 of 1.
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const rows = visible.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    setPage(0);
    if (key === sortKey) {
      setDescending((value) => !value);
      return;
    }
    setSortKey(key);
    setDescending(true);
  };

  const sortArrow = (key: SortKey) =>
    key === sortKey ? (
      descending ? (
        <LuArrowDown className="text-[11px]" />
      ) : (
        <LuArrowUp className="text-[11px]" />
      )
    ) : null;

  if (isLoading) {
    return <div className={`${subHistoryCardClass} ${appPulseSurfaceClass} h-[320px]`} />;
  }

  if (transactions.length === 0) {
    return (
      <div className={subHistoryCardClass}>
        <p className={subHistoryEmptyClass}>{t("transactions.empty")}</p>
      </div>
    );
  }

  return (
    <section className={subHistoryCardClass}>
      <div className={subHistoryToolbarClass}>
        <div className={subHistorySearchWrapClass}>
          <LuSearch className="shrink-0 text-[14px] text-white/38" />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            placeholder={t("transactions.searchPlaceholder")}
            className={subHistorySearchInputClass}
          />
        </div>

        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as StatusFilter);
            setPage(0);
          }}
          className={subHistorySelectClass}
          aria-label={t("transactions.filterStatus")}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option} className="bg-[#15131a]">
              {option === "all"
                ? t("transactions.allStatuses")
                : t(`transactions.status.${option}`)}
            </option>
          ))}
        </select>

        <select
          value={range}
          onChange={(event) => {
            setRange(event.target.value as DateFilter);
            setPage(0);
          }}
          className={subHistorySelectClass}
          aria-label={t("transactions.filterDate")}
        >
          {DATE_OPTIONS.map((option) => (
            <option key={option} value={option} className="bg-[#15131a]">
              {t(`transactions.dates.${option}`)}
            </option>
          ))}
        </select>
      </div>

      {rows.length === 0 ? (
        <p className={subHistoryEmptyClass}>{t("transactions.noMatches")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className={subHistoryHeadRowClass}>
                <th className={subHistoryHeadCellClass}>{t("transactions.columns.description")}</th>
                <th className={subHistoryHeadCellClass}>
                  <button
                    type="button"
                    onClick={() => toggleSort("date")}
                    className={subHistorySortButtonClass}
                  >
                    {t("transactions.columns.date")}
                    {sortArrow("date")}
                  </button>
                </th>
                <th className={subHistoryHeadCellClass}>{t("transactions.columns.status")}</th>
                <th className={subHistoryHeadCellClass}>
                  <button
                    type="button"
                    onClick={() => toggleSort("amount")}
                    className={subHistorySortButtonClass}
                  >
                    {t("transactions.columns.total")}
                    {sortArrow("amount")}
                  </button>
                </th>
                <th className={subHistoryHeadCellClass}>{t("transactions.columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((tx) => (
                <tr key={tx.id} className={subHistoryRowClass}>
                  <td className={subHistoryCellClass}>
                    <div className="flex items-center gap-3">
                      <span className={subHistoryIconClass}>
                        <LuCrown className="text-[14px]" />
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium text-white/88">
                          {describe(tx)}
                        </span>
                        {/* The reference a receipt or a support email would quote. */}
                        <span className="truncate text-[11.5px] text-white/38">
                          {tx.transactionId}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className={`${subHistoryCellClass} whitespace-nowrap tabular-nums text-white/58`}>
                    {formatDate(tx.createdAt)}
                  </td>
                  <td className={subHistoryCellClass}>
                    <span
                      className={`${appTransactionStatusBadgeClass} ${STATUS_CLASS[tx.status]}`}
                    >
                      {t(`transactions.status.${tx.status}`)}
                    </span>
                  </td>
                  <td className={`${subHistoryCellClass} whitespace-nowrap font-medium tabular-nums text-white/88`}>
                    {formatPlanPrice(tx.amount, tx.currency)}
                  </td>
                  <td className={subHistoryCellClass}>
                    {tx.invoiceUrl ? (
                      <a
                        href={tx.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={subHistoryInvoiceLinkClass}
                      >
                        {t("transactions.viewInvoice")}
                        <LuExternalLink className="text-[12px]" />
                      </a>
                    ) : (
                      // A charge that never completed has no receipt, and neither do rows
                      // written before the invoice column existed.
                      <span className="text-[12.5px] text-white/28">
                        {t("transactions.noInvoice")}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {visible.length > PAGE_SIZE ? (
        <div className={subHistoryPagerClass}>
          <span>
            {t("transactions.showing", {
              from: current * PAGE_SIZE + 1,
              to: Math.min(visible.length, (current + 1) * PAGE_SIZE),
              total: visible.length,
            })}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(current - 1)}
              disabled={current === 0}
              aria-label={t("transactions.previousPage")}
              className={subHistoryPagerButtonClass}
            >
              <LuChevronLeft />
            </button>
            <span className="tabular-nums text-white/62">
              {current + 1} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage(current + 1)}
              disabled={current >= pageCount - 1}
              aria-label={t("transactions.nextPage")}
              className={subHistoryPagerButtonClass}
            >
              <LuChevronRight />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default PurchaseHistory;
