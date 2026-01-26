export default async function AdminLayout({
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
