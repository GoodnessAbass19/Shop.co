export default async function RiderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="" suppressHydrationWarning>
      {children}
    </main>
  );
}
