import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="">
      <div className="w-full bg-white shadow-md p-4">
        <div className="max-w-screen-xl mx-auto">
          <Link
            href={"/"}
            className="text-black lg:text-3xl md:text-2xl text-xl font-extrabold uppercase"
          >
            shop.co
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
// s@FAJADNBB6va9r
