// main.tsx — entry point. Wraps the app in all required providers.
// Provider order matters: Theme + Lang are read by the modals, so they wrap
// the modal providers. UploadModal/DocumentDetail/CommandPalette providers
// each render their own modal as a sibling to children, so they nest cleanly.

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme";
import { LangProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import { UploadModalProvider } from "@/lib/upload-modal";
import { DocumentDetailProvider } from "@/lib/document-detail";
import { CommandPaletteProvider } from "@/lib/command-palette";
import { App } from "@/App";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");

createRoot(rootEl).render(
  <StrictMode>
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <BrowserRouter>
            <UploadModalProvider>
              <DocumentDetailProvider>
                <CommandPaletteProvider>
                  <App />
                </CommandPaletteProvider>
              </DocumentDetailProvider>
            </UploadModalProvider>
          </BrowserRouter>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  </StrictMode>,
);
