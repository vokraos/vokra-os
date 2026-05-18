import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { NavId } from "../types";
import { useI18n } from "../lib/i18n/I18nContext";
import type {
  VisualApprovedUsage,
  VisualDecisionScores,
  VisualProductionJob,
  VisualProductionJobStatus,
  VisualProductionJobType,
  VisualProductionQueueEnvelope,
  VisualProductionTargetTool,
  VisualReviewNotes,
  VisualReviewStatus,
} from "../lib/visual-production";
import {
  VISUAL_PRODUCTION_SESSION_KEY,
  clearVisualProductionSession,
  consumeRerunVisualProductionQueue,
  consumeVisualProductionFocusJobId,
  defaultApprovedUsagesWhenEmpty,
  loadVisualProductionQueueFromSession,
  pipelinePatchForReviewStatus,
  queueToJsonString,
  saveVisualProductionQueueToSession,
  suggestPromptRewrite,
} from "../lib/visual-production";
import { buildVisualAssetFromJob, loadVisualAssetRegistryFromSession, tryAppendVisualAsset } from "../lib/visual-assets";
import { recordGeneration } from "../lib/memory";
import { copyToClipboard } from "../lib/markdown";

type Props = { onNavigate: (id: NavId) => void };

const PIPELINE: VisualProductionJobStatus[] = ["queued", "copied", "generated_externally", "selected"];

const TOOL_IDS: VisualProductionTargetTool[] = [
  "grok",
  "midjourney",
  "nano_banana",
  "flux",
  "ideogram",
  "kling_veo",
  "other",
];

const REVIEW_STATUS_IDS: VisualReviewStatus[] = [
  "pending",
  "generated",
  "shortlisted",
  "approved_marketplace",
  "approved_campaign",
  "rejected_brand_fit",
  "rejected_marketplace_clarity",
  "needs_prompt_rewrite",
];

const DECISION_KEYS: (keyof VisualDecisionScores)[] = [
  "brandFit",
  "marketplaceClarity",
  "printReadability",
  "premiumPerception",
  "dtfRealism",
  "thumbnailStrength",
  "fatigueRisk",
];

const USAGE_IDS: VisualApprovedUsage[] = [
  "wb_hero",
  "ozon_hero",
  "rich_content",
  "reels",
  "exhibition",
  "corporate_merch",
  "campaign",
];

function excerpt(s: string, n: number): string {
  const x = s.trim();
  if (x.length <= n) return x;
  return `${x.slice(0, n - 1)}…`;
}

function mergeJob(j: VisualProductionJob, patch: Partial<VisualProductionJob>): VisualProductionJob {
  const now = Date.now();
  return {
    ...j,
    ...patch,
    visualReviewNotes:
      patch.visualReviewNotes !== undefined ? { ...j.visualReviewNotes, ...patch.visualReviewNotes } : j.visualReviewNotes,
    decisionScores:
      patch.decisionScores !== undefined ? { ...j.decisionScores, ...patch.decisionScores } : j.decisionScores,
    approvedUsages: patch.approvedUsages !== undefined ? [...patch.approvedUsages] : j.approvedUsages,
    updatedAt: now,
  };
}

function patchJob(jobs: VisualProductionJob[], id: string, patch: Partial<VisualProductionJob>): VisualProductionJob[] {
  return jobs.map((j) => (j.id === id ? mergeJob(j, patch) : j));
}

function avgDecisionScores(s: VisualDecisionScores): number | null {
  const vals = Object.values(s).filter((v): v is number => v !== null);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function grandAvgForJobs(jobs: VisualProductionJob[]): string {
  const vals = jobs.map((j) => avgDecisionScores(j.decisionScores)).filter((n): n is number => n !== null);
  if (vals.length === 0) return "";
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
}

export function VisualProductionView({ onNavigate }: Props) {
  const { t } = useI18n();
  const [envelope, setEnvelope] = useState<VisualProductionQueueEnvelope | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [regTick, setRegTick] = useState(0);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  const persist = useCallback((next: VisualProductionQueueEnvelope) => {
    saveVisualProductionQueueToSession(next);
    setEnvelope(next);
  }, []);

  useEffect(() => {
    setInvalid(false);
    const fromSession = loadVisualProductionQueueFromSession();
    if (fromSession) {
      setEnvelope(fromSession);
      return;
    }
    const fromRerun = consumeRerunVisualProductionQueue();
    if (fromRerun) {
      saveVisualProductionQueueToSession(fromRerun);
      setEnvelope(fromRerun);
      return;
    }
    try {
      if (sessionStorage.getItem(VISUAL_PRODUCTION_SESSION_KEY)) {
        clearVisualProductionSession();
        setInvalid(true);
      }
    } catch {
      setInvalid(true);
    }
  }, []);

  useEffect(() => {
    if (!envelope) return;
    const id = consumeVisualProductionFocusJobId();
    if (!id) return;
    window.requestAnimationFrame(() => {
      document.querySelector(`[data-vp-job="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, [envelope]);

  const jobs = envelope?.jobs ?? [];

  const registeredJobIds = useMemo(() => {
    void regTick;
    const r = loadVisualAssetRegistryFromSession();
    return new Set(r?.assets.map((a) => a.sourceJobId) ?? []);
  }, [regTick]);

  const activePipeline = useMemo(() => jobs.filter((j) => PIPELINE.includes(j.status)).sort((a, b) => a.priority - b.priority), [jobs]);

  const byType = useCallback(
    (types: VisualProductionJobType[]) =>
      jobs.filter((j) => types.includes(j.jobType) && PIPELINE.includes(j.status)).sort((a, b) => a.priority - b.priority),
    [jobs],
  );

  const approved = useMemo(() => jobs.filter((j) => j.status === "approved"), [jobs]);
  const needsRev = useMemo(() => jobs.filter((j) => j.status === "needs_revision"), [jobs]);
  const rejected = useMemo(() => jobs.filter((j) => j.status === "rejected"), [jobs]);

  const onJobPatch = useCallback(
    (jobId: string, patch: Partial<VisualProductionJob>) => {
      if (!envelope) return;
      persist({ ...envelope, jobs: patchJob(envelope.jobs, jobId, patch) });
    },
    [envelope, persist],
  );

  const onCopyPrompt = useCallback(
    (job: VisualProductionJob) => {
      void copyToClipboard(job.prompt).then(() => {
        if (!envelope) return;
        persist({ ...envelope, jobs: patchJob(envelope.jobs, job.id, { status: "copied" }) });
        showToast(t("visualProduction.toastCopied"));
      });
    },
    [envelope, persist, showToast, t],
  );

  const setStatus = useCallback(
    (job: VisualProductionJob, status: VisualProductionJobStatus) => {
      if (!envelope) return;
      let extra: Partial<VisualProductionJob> = {};
      if (status === "approved") {
        extra.reviewStatus = "approved_marketplace";
        extra.approvedUsages =
          job.approvedUsages.length > 0
            ? [...job.approvedUsages]
            : defaultApprovedUsagesWhenEmpty(job.jobType, "approved_marketplace");
      } else if (status === "rejected") {
        extra.reviewStatus = "rejected_brand_fit";
      } else if (status === "needs_revision") {
        extra.reviewStatus = "needs_prompt_rewrite";
      } else if (status === "generated_externally") {
        extra.reviewStatus = "generated";
      } else if (status === "selected") {
        extra.reviewStatus = "shortlisted";
      }
      persist({ ...envelope, jobs: patchJob(envelope.jobs, job.id, { status, ...extra }) });
    },
    [envelope, persist],
  );

  const setTool = useCallback(
    (job: VisualProductionJob, targetTool: VisualProductionTargetTool) => {
      if (!envelope) return;
      persist({ ...envelope, jobs: patchJob(envelope.jobs, job.id, { targetTool }) });
    },
    [envelope, persist],
  );

  const onRegisterAsset = useCallback(
    (job: VisualProductionJob) => {
      if (!envelope) return;
      const asset = buildVisualAssetFromJob(job, {
        collectionId: envelope.sourceCollectionId,
        collectionName: envelope.collectionName,
        promptPackId: envelope.sourcePromptPackId,
      });
      const res = tryAppendVisualAsset(asset);
      if (!res.ok) {
        showToast(t("visualProduction.registerAssetDup"));
        return;
      }
      setRegTick((n) => n + 1);
      showToast(t("visualProduction.registerAssetOk"));
    },
    [envelope, showToast, t],
  );

  const saveMemory = useCallback(() => {
    if (!envelope) return;
    const decided = envelope.jobs.filter((j) => j.reviewStatus !== "pending").length;
    const rewrites = envelope.jobs.filter((j) => j.promptRewriteSuggested.trim().length > 0).length;
    recordGeneration({
      module: "visual_production",
      title: `${envelope.collectionName} · Visual production · ${envelope.sourcePromptPackId}`,
      content: queueToJsonString(envelope),
      mime: "application/json",
      tags: ["visual_production", envelope.sourceCollectionId, envelope.sourcePromptPackId],
      meta: {
        sourcePromptPackId: envelope.sourcePromptPackId,
        jobCount: String(envelope.jobs.length),
        reviewDecisionsCount: String(decided),
        decisionScoreGrandAvg: grandAvgForJobs(envelope.jobs),
        rewritePromptsCount: String(rewrites),
      },
    });
    showToast(t("visualProduction.toastSavedMemory"));
  }, [envelope, showToast, t]);

  const clear = useCallback(() => {
    clearVisualProductionSession();
    setEnvelope(null);
    setInvalid(false);
    showToast(t("visualProduction.toastCleared"));
  }, [showToast, t]);

  if (!envelope) {
    return (
      <div className="cb-lab vp-empty">
        <header className="cb-lab__head">
          <p className="cb-lab__eyebrow">{t("visualProduction.eyebrow")}</p>
          <h1 className="cb-lab__title">{t("nav.visualProduction")}</h1>
          <p className="cb-lab__lede">{invalid ? t("visualProduction.invalidSession") : t("visualProduction.empty")}</p>
          <div className="vp-empty__actions">
            <button type="button" className="ghost-btn" onClick={() => onNavigate("promptPack")}>
              {t("visualProduction.openPromptPack")}
            </button>
            <button type="button" className="ghost-btn" onClick={() => onNavigate("memory")}>
              {t("visualProduction.openMemory")}
            </button>
          </div>
        </header>
      </div>
    );
  }

  const cardProps = (job: VisualProductionJob) => ({
    job,
    t,
    onCopy: () => onCopyPrompt(job),
    onMarkExternal: () => setStatus(job, "generated_externally"),
    onSelected: () => setStatus(job, "selected"),
    onNeedsRev: () => setStatus(job, "needs_revision"),
    onApprove: () => setStatus(job, "approved"),
    onReject: () => setStatus(job, "rejected"),
    onToolChange: (tool: VisualProductionTargetTool) => setTool(job, tool),
    onJobPatch: (patch: Partial<VisualProductionJob>) => onJobPatch(job.id, patch),
    toolIds: TOOL_IDS,
    canRegisterAsset:
      job.status === "approved" ||
      job.reviewStatus === "approved_marketplace" ||
      job.reviewStatus === "approved_campaign",
    isAssetRegistered: registeredJobIds.has(job.id),
    onRegisterAsset: () => onRegisterAsset(job),
    onOpenAssetRegistry: () => onNavigate("visualAssets"),
  });

  return (
    <div className="cb-lab vp-lab">
      <header className="cb-lab__head">
        <p className="cb-lab__eyebrow">{t("visualProduction.eyebrow")}</p>
        <h1 className="cb-lab__title">{t("nav.visualProduction")}</h1>
        <p className="cb-lab__lede">{t("visualProduction.lede")}</p>
        <p className="vp-meta">
          {envelope.collectionName} · pack <code>{envelope.sourcePromptPackId}</code> · {envelope.jobs.length} jobs
        </p>
        <div className="cb-lab__actions">
          <button type="button" className="ghost-btn" onClick={saveMemory}>
            {t("visualProduction.saveMemory")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("visualAssets")}>
            {t("visualProduction.openAssetRegistry")}
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate("promptPack")}>
            {t("visualProduction.backPromptPack")}
          </button>
          <button type="button" className="ghost-btn" onClick={clear}>
            {t("visualProduction.clearSession")}
          </button>
        </div>
        {toast ? <p className="cb-lab__toast">{toast}</p> : null}
      </header>

      <VpSection title={t("visualProduction.section.active")} jobs={activePipeline} emptyHint={t("visualProduction.emptyLane")}>
        {(job) => <JobCard {...cardProps(job)} />}
      </VpSection>

      <VpSection
        title={t("visualProduction.section.hero")}
        jobs={byType([
          "hero_visual",
          "hero_test_variant",
          "readability_test",
          "premium_test",
          "framing_test",
          "refresh_test",
        ])}
        emptyHint={t("visualProduction.emptyLane")}
      >
        {(job) => <JobCard {...cardProps(job)} />}
      </VpSection>

      <VpSection
        title={t("visualProduction.section.support")}
        jobs={[...byType(["support_visual"]), ...byType(["detail_shot", "size_grid_visual"])]}
        emptyHint={t("visualProduction.emptyLane")}
      >
        {(job) => <JobCard {...cardProps(job)} />}
      </VpSection>

      <VpSection title={t("visualProduction.section.reels")} jobs={byType(["reels_concept"])} emptyHint={t("visualProduction.emptyLane")}>
        {(job) => <JobCard {...cardProps(job)} />}
      </VpSection>

      <VpSection
        title={t("visualProduction.section.campaign")}
        jobs={byType(["campaign_visual", "exhibition_visual", "corporate_merch_visual"])}
        emptyHint={t("visualProduction.emptyLane")}
      >
        {(job) => <JobCard {...cardProps(job)} />}
      </VpSection>

      <VpSection title={t("visualProduction.section.approved")} jobs={approved} emptyHint={t("visualProduction.emptyLane")}>
        {(job) => <JobCard {...cardProps(job)} />}
      </VpSection>

      <VpSection title={t("visualProduction.section.needsRevision")} jobs={needsRev} emptyHint={t("visualProduction.emptyLane")}>
        {(job) => <JobCard {...cardProps(job)} />}
      </VpSection>

      <VpSection title={t("visualProduction.section.rejected")} jobs={rejected} emptyHint={t("visualProduction.emptyLane")}>
        {(job) => <JobCard {...cardProps(job)} />}
      </VpSection>

      <style>{`
        .vp-meta { font-size: 0.72rem; color: var(--muted); margin: 0 0 8px; }
        .vp-empty__actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
        .vp-sec { margin-bottom: 18px; }
        .vp-sec__h { font-size: 0.72rem; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(160, 180, 215, 0.9); margin: 0 0 10px; }
        .vp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
        .vp-card {
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.22);
          padding: 12px;
          font-size: 0.78rem;
        }
        .vp-card__title { font-weight: 600; margin: 0 0 6px; }
        .vp-card__row { display: flex; flex-wrap: wrap; gap: 6px 10px; margin-bottom: 6px; color: rgba(175, 190, 220, 0.9); font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; }
        .vp-card__pre {
          margin: 0 0 8px;
          white-space: pre-wrap;
          word-break: break-word;
          font-family: ui-monospace, monospace;
          font-size: 0.72rem;
          line-height: 1.4;
          color: rgba(200, 210, 235, 0.92);
          max-height: 120px;
          overflow: auto;
        }
        .vp-card__qc { margin: 0 0 8px; padding-left: 1rem; font-size: 0.7rem; color: rgba(165, 180, 210, 0.85); }
        .vp-card__actions { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
        .vp-card__select { font-size: 0.68rem; background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.12); color: var(--text); border-radius: 6px; padding: 4px 8px; }
        .vp-review { margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; gap: 8px; }
        .vp-review__h { font-size: 0.65rem; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(140, 160, 200, 0.95); margin: 0; }
        .vp-review__field { display: flex; flex-direction: column; gap: 3px; }
        .vp-review__field label { font-size: 0.62rem; color: rgba(160, 175, 205, 0.9); text-transform: uppercase; letter-spacing: 0.06em; }
        .vp-review__field textarea, .vp-review__field input[type="text"] {
          font-size: 0.72rem; font-family: inherit;
          background: rgba(0,0,0,0.28); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: var(--text);
          padding: 6px 8px; resize: vertical; min-height: 36px;
        }
        .vp-review__scores { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 10px; }
        .vp-review__score { display: flex; flex-direction: column; gap: 2px; }
        .vp-review__score label { font-size: 0.58rem; color: rgba(150, 168, 200, 0.88); }
        .vp-review__usages { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; }
        .vp-review__usage { display: flex; align-items: center; gap: 4px; font-size: 0.68rem; color: rgba(185, 198, 225, 0.92); }
        .vp-review__rewrite { font-size: 0.7rem; font-family: ui-monospace, monospace; min-height: 72px; }
        .vp-review__row-actions { display: flex; flex-wrap: wrap; gap: 6px; }
      `}</style>
    </div>
  );
}

function VpSection({
  title,
  jobs,
  emptyHint,
  children,
}: {
  title: string;
  jobs: VisualProductionJob[];
  emptyHint: string;
  children: (job: VisualProductionJob) => ReactNode;
}) {
  return (
    <section className="cb-lab__panel glass-panel vp-sec">
      <h2 className="vp-sec__h">{title}</h2>
      {jobs.length === 0 ? <p className="cb-lab__prose cb-lab__prose--tight">{emptyHint}</p> : null}
      <div className="vp-grid">{jobs.map((j) => children(j))}</div>
    </section>
  );
}

function JobCard({
  job,
  t,
  onCopy,
  onMarkExternal,
  onSelected,
  onNeedsRev,
  onApprove,
  onReject,
  onToolChange,
  onJobPatch,
  toolIds,
  canRegisterAsset,
  isAssetRegistered,
  onRegisterAsset,
  onOpenAssetRegistry,
}: {
  job: VisualProductionJob;
  t: (k: string, v?: Record<string, string>) => string;
  onCopy: () => void;
  onMarkExternal: () => void;
  onSelected: () => void;
  onNeedsRev: () => void;
  onApprove: () => void;
  onReject: () => void;
  onToolChange: (tool: VisualProductionTargetTool) => void;
  onJobPatch: (patch: Partial<VisualProductionJob>) => void;
  toolIds: VisualProductionTargetTool[];
  canRegisterAsset: boolean;
  isAssetRegistered: boolean;
  onRegisterAsset: () => void;
  onOpenAssetRegistry: () => void;
}) {
  const isRejected = job.status === "rejected";
  const isApproved = job.status === "approved";

  const onReviewStatusChange = (rs: VisualReviewStatus) => {
    const pipe = pipelinePatchForReviewStatus(rs);
    let approvedUsages = [...job.approvedUsages];
    if ((rs === "approved_marketplace" || rs === "approved_campaign") && approvedUsages.length === 0) {
      approvedUsages = defaultApprovedUsagesWhenEmpty(job.jobType, rs);
    }
    const patch: Partial<VisualProductionJob> = {
      reviewStatus: rs,
      approvedUsages,
      ...(pipe?.status ? { status: pipe.status } : {}),
    };
    onJobPatch(patch);
  };

  const setNote = (key: keyof VisualReviewNotes, value: string) => {
    onJobPatch({ visualReviewNotes: { ...job.visualReviewNotes, [key]: value } });
  };

  const setScore = (key: keyof VisualDecisionScores, raw: string) => {
    if (raw === "") {
      onJobPatch({ decisionScores: { ...job.decisionScores, [key]: null } });
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 1 || n > 5) return;
    onJobPatch({ decisionScores: { ...job.decisionScores, [key]: Math.round(n) } });
  };

  const toggleUsage = (u: VisualApprovedUsage) => {
    const has = job.approvedUsages.includes(u);
    const next = has ? job.approvedUsages.filter((x) => x !== u) : [...job.approvedUsages, u];
    onJobPatch({ approvedUsages: next });
  };

  const onGenerateRewrite = () => {
    const text = suggestPromptRewrite({
      originalPrompt: job.prompt,
      negativeConstraints: job.negativeConstraints,
      issueFound: job.visualReviewNotes.issueFound,
      revisionInstruction: job.visualReviewNotes.revisionInstruction,
    });
    onJobPatch({ promptRewriteSuggested: text });
  };

  const onCopyRewrite = () => {
    if (!job.promptRewriteSuggested.trim()) return;
    void copyToClipboard(job.promptRewriteSuggested);
  };

  const showUsages = job.reviewStatus === "approved_marketplace" || job.reviewStatus === "approved_campaign";
  const avg = avgDecisionScores(job.decisionScores);
  const canGenRewrite = job.reviewStatus === "needs_prompt_rewrite";

  return (
    <article className="vp-card" data-status={job.status} data-vp-job={job.id}>
      <p className="vp-card__title">{job.title}</p>
      <div className="vp-card__row">
        <span>
          {t("visualProduction.k.role")}: {job.visualRole}
        </span>
        <span>
          {t("visualProduction.k.priority")}: {job.priority}
        </span>
        <span>
          {t("visualProduction.k.status")}: {t(`visualProduction.status.${job.status}`)}
        </span>
        <span>
          {t("visualProduction.review.kReview")}: {t(`visualProduction.review.status.${job.reviewStatus}`)}
        </span>
        {avg !== null ? (
          <span>
            {t("visualProduction.review.avgCriteria")}: {avg.toFixed(2)}
          </span>
        ) : null}
      </div>
      <label className="cb-ws__field" style={{ marginBottom: 8 }}>
        <span className="cb-ws__label">{t("visualProduction.targetTool")}</span>
        <select className="vp-card__select" value={job.targetTool} onChange={(e) => onToolChange(e.target.value as VisualProductionTargetTool)}>
          {toolIds.map((id) => (
            <option key={id} value={id}>
              {t(`visualProduction.tool.${id}`)}
            </option>
          ))}
        </select>
      </label>
      <p className="cb-lab__prose cb-lab__prose--tight" style={{ fontSize: "0.72rem", marginBottom: 6 }}>
        <strong>{t("visualProduction.expected")}</strong> {job.expectedOutput}
      </p>
      <pre className="vp-card__pre">{excerpt(job.prompt, 420)}</pre>
      <ul className="vp-card__qc">
        {job.qualityCriteria.slice(0, 8).map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <div className="vp-card__actions">
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={onCopy}>
          {t("visualProduction.copyPrompt")}
        </button>
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={onMarkExternal} disabled={isApproved || isRejected}>
          {t("visualProduction.markExternal")}
        </button>
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={onSelected} disabled={isApproved || isRejected}>
          {t("visualProduction.markSelected")}
        </button>
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={onNeedsRev} disabled={isRejected}>
          {t("visualProduction.markNeedsRevision")}
        </button>
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={onApprove} disabled={isApproved}>
          {t("visualProduction.approve")}
        </button>
        <button type="button" className="ghost-btn ghost-btn--sm" onClick={onReject} disabled={isRejected}>
          {t("visualProduction.reject")}
        </button>
        {canRegisterAsset ? (
          <>
            <button type="button" className="ghost-btn ghost-btn--sm" onClick={onRegisterAsset} disabled={isAssetRegistered}>
              {t("visualProduction.registerAsset")}
            </button>
            <button type="button" className="ghost-btn ghost-btn--sm" onClick={onOpenAssetRegistry}>
              {t("visualProduction.openAssetRegistry")}
            </button>
          </>
        ) : null}
      </div>

      <div className="vp-review">
        <p className="vp-review__h">{t("visualProduction.review.panelTitle")}</p>
        <label className="cb-ws__field" style={{ marginBottom: 0 }}>
          <span className="cb-ws__label">{t("visualProduction.review.reviewStatus")}</span>
          <select
            className="vp-card__select"
            style={{ width: "100%" }}
            value={job.reviewStatus}
            onChange={(e) => onReviewStatusChange(e.target.value as VisualReviewStatus)}
          >
            {REVIEW_STATUS_IDS.map((id) => (
              <option key={id} value={id}>
                {t(`visualProduction.review.status.${id}`)}
              </option>
            ))}
          </select>
        </label>

        {(["selectedResultNote", "whySelected", "issueFound", "revisionInstruction", "finalUsage"] as const).map((key) => (
          <div key={key} className="vp-review__field">
            <label htmlFor={`${job.id}-${key}`}>{t(`visualProduction.review.notes.${key}`)}</label>
            <textarea
              id={`${job.id}-${key}`}
              rows={key === "issueFound" || key === "revisionInstruction" ? 2 : 2}
              value={job.visualReviewNotes[key]}
              onChange={(e) => setNote(key, e.target.value)}
            />
          </div>
        ))}

        <p className="vp-review__h">{t("visualProduction.review.criteriaTitle")}</p>
        <div className="vp-review__scores">
          {DECISION_KEYS.map((key) => (
            <div key={key} className="vp-review__score">
              <label htmlFor={`${job.id}-sc-${key}`}>{t(`visualProduction.review.criteria.${key}`)}</label>
              <select
                id={`${job.id}-sc-${key}`}
                className="vp-card__select"
                value={job.decisionScores[key] ?? ""}
                onChange={(e) => setScore(key, e.target.value)}
              >
                <option value="">{t("visualProduction.review.scoreUnset")}</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {showUsages ? (
          <>
            <p className="vp-review__h">{t("visualProduction.review.usagesTitle")}</p>
            <div className="vp-review__usages">
              {USAGE_IDS.map((u) => (
                <label key={u} className="vp-review__usage">
                  <input type="checkbox" checked={job.approvedUsages.includes(u)} onChange={() => toggleUsage(u)} />
                  {t(`visualProduction.review.usage.${u}`)}
                </label>
              ))}
            </div>
          </>
        ) : null}

        <p className="vp-review__h">{t("visualProduction.review.rewriteTitle")}</p>
        <textarea
          className="vp-review__rewrite"
          readOnly
          rows={4}
          value={job.promptRewriteSuggested}
          placeholder={t("visualProduction.review.rewritePlaceholder")}
        />
        <div className="vp-review__row-actions">
          <button type="button" className="ghost-btn ghost-btn--sm" onClick={onGenerateRewrite} disabled={!canGenRewrite}>
            {t("visualProduction.review.generateRewrite")}
          </button>
          <button type="button" className="ghost-btn ghost-btn--sm" onClick={onCopyRewrite} disabled={!job.promptRewriteSuggested.trim()}>
            {t("visualProduction.review.copyRewrite")}
          </button>
        </div>
      </div>
    </article>
  );
}
