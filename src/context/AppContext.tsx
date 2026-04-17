import React, { createContext, useContext } from "react";
import { useUI } from "./useUI";
import { useConfig } from "./useConfig";
import { useNotifications } from "./useNotifications";
import { useHistory } from "./useHistory";

type AppContextType = ReturnType<typeof useUI> &
  ReturnType<typeof useConfig> &
  ReturnType<typeof useNotifications> &
  ReturnType<typeof useHistory>;

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const uiState = useUI();
  const configState = useConfig();
  const notificationState = useNotifications();
  const historyState = useHistory(configState.deleteFilesOnHistoryDelete);

  return (
    <AppContext.Provider value={{
      ...uiState,
      ...configState,
      ...notificationState,
      ...historyState
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
