"use client";

import client from "@/lib/apollo-client";
import { ApolloProvider } from "@apollo/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const queryClient = new QueryClient();

const Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {/* <ApolloProvider client={client}>
        {children}</ApolloProvider>\ */}
      {children}
    </QueryClientProvider>
  );
};

export default Provider;
