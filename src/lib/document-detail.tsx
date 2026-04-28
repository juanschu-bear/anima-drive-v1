// document-detail.tsx — global trigger for the document detail modal.

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { RecentDoc } from "@/types";
import { DocumentDetailModal } from "@/components/DocumentDetailModal";

interface DocumentDetailCtx {
  openDoc: (doc: RecentDoc) => void;
  close: () => void;
  current: RecentDoc | null;
}

const Ctx = createContext<DocumentDetailCtx | null>(null);

export function DocumentDetailProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<RecentDoc | null>(null);
  const openDoc = useCallback((doc: RecentDoc) => setCurrent(doc), []);
  const close = useCallback(() => setCurrent(null), []);

  const value = useMemo(() => ({ openDoc, close, current }), [openDoc, close, current]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <DocumentDetailModal doc={current} onClose={close} />
    </Ctx.Provider>
  );
}

export function useDocumentDetail(): DocumentDetailCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDocumentDetail must be used within DocumentDetailProvider");
  return v;
}
