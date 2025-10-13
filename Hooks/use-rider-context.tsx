"use client";

import { Rider, User } from "@prisma/client";
import { createContext, useContext } from "react";

// Define the context value type
interface RiderContextType {
  rider: Rider & {
    user: User;
  };
}

// Create the context
const RiderContext = createContext<RiderContextType | undefined>(undefined);

// Create a provider component
export function RiderProvider({
  children,
  rider,
}: {
  children: React.ReactNode;
  rider: Rider & { user: User };
}) {
  return (
    <RiderContext.Provider value={{ rider }}>{children}</RiderContext.Provider>
  );
}
// Create a custom hook to use the RiderContext
export const useRiderContext = () => {
  const context = useContext(RiderContext);
  if (context === undefined) {
    throw new Error("useRiderContext must be used within a RiderProvider");
  }
  return context;
};
