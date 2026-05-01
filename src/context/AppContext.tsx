import React, { createContext } from "react";
import { useUI } from "./useUI";
import { useConfig } from "./useConfig";
import { useNotifications } from "./useNotifications";
import { useHistory } from "./useHistory";

type AppContextType = ReturnType<typeof useUI> &
  ReturnType<typeof useConfig> &
  ReturnType<typeof useNotifications> &
  ReturnType<typeof useHistory>;

export const AppContext = createContext<AppContextType | undefined>(undefined);

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
