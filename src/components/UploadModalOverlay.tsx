// UploadModalOverlay.tsx — real drag&drop upload to Supabase Storage.
// On drop: uploads each file to ad-docs/<user_id>/<uuid>.<ext>, inserts a
// row into ad_documents with status='uploaded', then kicks off /api/categorize.
// Falls back to a demo simulation when Supabase isn't configured.

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, DragEvent } from "react";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured, supabase, STORAGE_BUCKET } from "@/lib/supabase";
import { useDocuments } from "@/lib/useDocuments";
import { numStyle } from "@/lib/utils";
import { Panel } from "@/components/ui/Panel";
import { Icon } from "@/components/ui/Icon";

interface UploadModalOverlayProps {
  open: boolean;
  onClose: () => void;
}

interface UploadJob {
  id: string;
  file: File;
  progress: number;          // 0..100
  status: "queued" | "uploading" | "categorizing" | "ready" | "failed";
  error?: string;
}

const ACCEPTED_EXT = ["pdf", "jpg", "jpeg", "png", "csv", "xlsx", "eml"];
const MAX_BYTES = 25 * 1024 * 1024;

function fileExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function UploadModalOverlay({ open, onClose }: UploadModalOverlayProps) {
  const { t } = useLang();
  const { user } = useAuth();
  const { refresh } = useDocuments();
  const configured = isSupabaseConfigured();
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset jobs when modal closes.
  useEffect(() => {
    if (!open) {
      setJobs([]);
      setDragOver(false);
    }
  }, [open]);

  const updateJob = useCallback((id: string, patch: Partial<UploadJob>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }, []);

  const processOne = useCallback(
    async (job: UploadJob) => {
      const ext = fileExt(job.file.name);
      if (job.file.size > MAX_BYTES) {
        updateJob(job.id, { status: "failed", error: "File exceeds 25 MB limit." });
        return;
      }
      if (ext && !ACCEPTED_EXT.includes(ext)) {
        updateJob(job.id, { status: "failed", error: `Unsupported file type: .${ext}` });
        return;
      }

      // Demo mode — fake the progress and stop.
      if (!configured || !user) {
        updateJob(job.id, { status: "uploading", progress: 0 });
        const totalSteps = 30;
        for (let s = 1; s <= totalSteps; s++) {
          await new Promise((r) => setTimeout(r, 60));
          updateJob(job.id, { progress: Math.round((s / totalSteps) * 100) });
        }
        updateJob(job.id, { status: "ready", progress: 100 });
        return;
      }

      // Real upload.
      updateJob(job.id, { status: "uploading", progress: 5 });
      const docId = uuid();
      const path = `${user.id}/${docId}.${ext || "bin"}`;

      const { error: storageErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, job.file, {
          contentType: job.file.type || undefined,
          upsert: false,
        });

      if (storageErr) {
        updateJob(job.id, { status: "failed", error: storageErr.message });
        return;
      }
      updateJob(job.id, { progress: 70 });

      // Insert document row.
      const insertPayload = {
        id: docId,
        user_id: user.id,
        filename: job.file.name,
        ext: ext || "bin",
        size_bytes: job.file.size,
        storage_path: path,
        mime_type: job.file.type || null,
        status: "uploaded" as const,
        category_key: null,
        category_confidence: null,
        error_message: null,
      };
      const { error: insertErr } = await supabase
        .from("ad_documents")
        .insert(insertPayload);

      if (insertErr) {
        updateJob(job.id, { status: "failed", error: insertErr.message });
        // try to clean up the orphaned blob
        await supabase.storage.from(STORAGE_BUCKET).remove([path]).catch(() => {});
        return;
      }

      updateJob(job.id, { progress: 85, status: "categorizing" });

      // Kick off categorize. The Vercel function will then internally call extract.
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        const res = await fetch("/api/categorize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ documentId: docId }),
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`categorize failed: ${res.status} ${txt}`);
        }
        updateJob(job.id, { progress: 100, status: "ready" });
      } catch (err) {
        // Doc is uploaded; categorization is async-fail-tolerant.
        // We mark the local job as ready but log the error.
        updateJob(job.id, {
          progress: 100,
          status: "ready",
          error: err instanceof Error ? err.message : "Categorization queued for retry.",
        });
      }

      // Refresh document list so the dashboard / browser reflect the new file.
      await refresh();
    },
    [configured, user, updateJob, refresh],
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;
      const newJobs: UploadJob[] = list.map((file) => ({
        id: uuid(),
        file,
        progress: 0,
        status: "queued",
      }));
      setJobs((prev) => [...prev, ...newJobs]);
      // Process sequentially; in V2 you could parallelize.
      (async () => {
        for (const j of newJobs) {
          await processOne(j);
        }
      })();
    },
    [processOne],
  );

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  if (!open) return null;

  const dropZoneStyle: CSSProperties = {
    height: 260,
    borderRadius: 16,
    border: dragOver
      ? "1.5px solid var(--ad-accent-mint)"
      : "1.5px dashed var(--ad-accent-mint)",
    background: dragOver
      ? "radial-gradient(closest-side, color-mix(in oklab, var(--ad-accent-mint) 18%, transparent), transparent 70%)"
      : "radial-gradient(closest-side, color-mix(in oklab, var(--ad-accent-mint) 8%, transparent), transparent 70%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    position: "relative",
    overflow: "hidden",
    cursor: "pointer",
    transition: "background 200ms, border 200ms",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        fontFamily: "'Geist', system-ui, sans-serif",
        color: "var(--ad-text)",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      />

      <div
        className="flex items-center justify-center"
        style={{ position: "absolute", inset: 0, zIndex: 3 }}
      >
        <Panel style={{ width: 640, padding: 32, position: "relative", maxHeight: "90vh", overflow: "auto" }}>
          <div
            onClick={onClose}
            className="flex items-center"
            style={{
              position: "absolute",
              top: 18,
              left: 18,
              gap: 6,
              fontSize: 12,
              color: "var(--ad-text-dim)",
              cursor: "pointer",
            }}
          >
            <Icon name="arrow-left" size={13} stroke={2} />
            Back
          </div>
          <div
            onClick={onClose}
            className="flex items-center justify-center"
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              width: 28,
              height: 28,
              borderRadius: 8,
              color: "var(--ad-text-dim)",
              background: "var(--ad-chip)",
              border: "1px solid var(--ad-border)",
              cursor: "pointer",
            }}
          >
            <Icon name="x" size={14} />
          </div>

          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            style={dropZoneStyle}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                animation: "zonePulse 2.6s ease-in-out infinite",
                background:
                  "radial-gradient(closest-side, color-mix(in oklab, var(--ad-accent-mint) 6%, transparent), transparent 70%)",
              }}
            />
            <div
              className="flex items-center justify-center"
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "color-mix(in oklab, var(--ad-accent-mint) 13%, transparent)",
                color: "var(--ad-accent-mint)",
                boxShadow: "0 0 40px color-mix(in oklab, var(--ad-accent-mint) 31%, transparent)",
                position: "relative",
                zIndex: 1,
              }}
            >
              <Icon name="upload" size={24} stroke={1.8} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.3, position: "relative", zIndex: 1 }}>
              {t("upl_title")}
            </div>
            <div style={{ fontSize: 12, color: "var(--ad-text-dim)", position: "relative", zIndex: 1 }}>
              {t("upl_sub")}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--ad-accent-mint)",
                marginTop: 2,
                fontWeight: 500,
                position: "relative",
                zIndex: 1,
              }}
            >
              {t("upl_browse")}
            </div>
            <div className="flex" style={{ gap: 6, marginTop: 10, position: "relative", zIndex: 1 }}>
              {["PDF", "JPG", "PNG", "CSV", "XLSX"].map((x) => (
                <span
                  key={x}
                  style={{
                    fontSize: 10,
                    padding: "3px 8px",
                    borderRadius: 5,
                    background: "var(--ad-chip)",
                    border: "1px solid var(--ad-border)",
                    color: "var(--ad-text-dim)",
                    fontWeight: 600,
                    fontFamily: "'Geist Mono', monospace",
                  }}
                >
                  {x}
                </span>
              ))}
            </div>

            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx,.eml,application/pdf,image/jpeg,image/png,text/csv"
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {/* In-flight files */}
          {jobs.length > 0 && (
            <div className="flex flex-col" style={{ marginTop: 20, gap: 12 }}>
              {jobs.map((j) => {
                const sizeLabel =
                  j.file.size < 1024 * 1024
                    ? `${(j.file.size / 1024).toFixed(0)} KB`
                    : `${(j.file.size / 1024 / 1024).toFixed(1)} MB`;

                const statusLabel =
                  j.status === "queued"
                    ? "Queued"
                    : j.status === "uploading"
                      ? `${Math.round(j.progress)}%`
                      : j.status === "categorizing"
                        ? "Categorizing…"
                        : j.status === "ready"
                          ? "Ready"
                          : "Failed";

                const tintColor =
                  j.status === "failed"
                    ? "var(--ad-accent-coral)"
                    : j.status === "ready"
                      ? "var(--ad-accent-mint)"
                      : "var(--ad-accent-blue)";

                return (
                  <div
                    key={j.id}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      background: "var(--ad-chip)",
                      border: "1px solid var(--ad-border)",
                    }}
                  >
                    <div className="flex items-center" style={{ gap: 10, marginBottom: 8 }}>
                      <Icon name="file" size={14} style={{ color: "var(--ad-text-dim)" }} />
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{j.file.name}</div>
                      <div style={{ fontSize: 11, color: "var(--ad-text-faint)", ...numStyle }}>
                        {statusLabel} · {sizeLabel}
                      </div>
                    </div>
                    <div
                      style={{
                        height: 4,
                        borderRadius: 2,
                        background: "var(--ad-hairline)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${j.progress}%`,
                          background:
                            j.status === "failed"
                              ? tintColor
                              : "linear-gradient(90deg, var(--ad-accent-mint), var(--ad-accent-blue))",
                          transition: "width 200ms linear",
                          boxShadow: `0 0 8px ${tintColor}`,
                        }}
                      />
                    </div>
                    {j.error && (
                      <div style={{ fontSize: 11, color: "var(--ad-accent-coral)", marginTop: 6 }}>
                        {j.error}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end" style={{ marginTop: 20, gap: 8 }}>
            <div
              onClick={onClose}
              className="flex items-center"
              style={{
                height: 34,
                padding: "0 14px",
                borderRadius: 9,
                background: "var(--ad-chip)",
                border: "1px solid var(--ad-border)",
                color: "var(--ad-text)",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {t("upl_cancel")}
            </div>
            <div
              onClick={onClose}
              className="flex items-center"
              style={{
                height: 34,
                padding: "0 18px",
                borderRadius: 9,
                background: "var(--ad-accent-mint)",
                color: "#09090b",
                fontSize: 12,
                fontWeight: 600,
                boxShadow: "0 0 20px color-mix(in oklab, var(--ad-accent-mint) 25%, transparent)",
                cursor: "pointer",
              }}
            >
              {t("upl_done")}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
