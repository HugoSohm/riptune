import type React from "react";
import { createContext, useContext } from "react";
import { useConfig } from "./useConfig";
import { useHistory } from "./useHistory";
import { useNotifications } from "./useNotifications";
import { useUI } from "./useUI";

type AppContextType = ReturnType<typeof useUI> &
  ReturnType<typeof useConfig> &
  ReturnType<typeof useNotifications> &
  ReturnType<typeof useHistory>;

export const AppContext = createContext<AppContextType | undefined>(undefined);

// Individual domain contexts
export const UIContext = createContext<ReturnType<typeof useUI> | undefined>(
  undefined,
);
export const ConfigContext = createContext<
  ReturnType<typeof useConfig> | undefined
>(undefined);
export const NotificationsContext = createContext<
  ReturnType<typeof useNotifications> | undefined
>(undefined);
export const HistoryContext = createContext<
  ReturnType<typeof useHistory> | undefined
>(undefined);

// Domain hook helpers for surgical state tracking and optimal render performance
export const useUIContext = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error("useUIContext must be used within an AppProvider");
  }
  return context;
};

export const useConfigContext = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error("useConfigContext must be used within an AppProvider");
  }
  return context;
};

export const useNotificationsContext = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error(
      "useNotificationsContext must be used within an AppProvider",
    );
  }
  return context;
};

export const useHistoryContext = () => {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error("useHistoryContext must be used within an AppProvider");
  }
  return context;
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const uiState = useUI();
  const configState = useConfig();
  const notificationState = useNotifications();
  const historyState = useHistory(configState.deleteFilesOnHistoryDelete);

  const appState = {
    ...uiState,
    ...configState,
    ...notificationState,
    ...historyState,
  };

  return (
    <AppContext.Provider value={appState}>
      <UIContext.Provider value={uiState}>
        <ConfigContext.Provider value={configState}>
          <NotificationsContext.Provider value={notificationState}>
            <HistoryContext.Provider value={historyState}>
              {children}
            </HistoryContext.Provider>
          </NotificationsContext.Provider>
        </ConfigContext.Provider>
      </UIContext.Provider>
    </AppContext.Provider>
  );
}
