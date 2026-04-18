"use client";

import { createContext, useContext, type ReactNode } from "react";

type DatabaseFeaturesValue = {
  /** Postgres is configured and responding (cached server-side). */
  databaseAvailable: boolean;
};

const DatabaseFeaturesContext = createContext<DatabaseFeaturesValue>({
  databaseAvailable: true,
});

export function DatabaseFeaturesProvider({
  databaseAvailable,
  children,
}: {
  databaseAvailable: boolean;
  children: ReactNode;
}) {
  return (
    <DatabaseFeaturesContext.Provider value={{ databaseAvailable }}>
      {children}
    </DatabaseFeaturesContext.Provider>
  );
}

export function useDatabaseFeatures(): DatabaseFeaturesValue {
  return useContext(DatabaseFeaturesContext);
}
