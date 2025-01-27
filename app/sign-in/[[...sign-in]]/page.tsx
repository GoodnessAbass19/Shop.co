// @ts-nocheck
import { SignIn } from "@clerk/nextjs";

export default function Page({ searchParams }) {
  const { redirectUrl } = searchParams;
  return (
    <div className="max-w-screen-xl mx-auto mt-10 flex flex-col justify-center items-center">
      <SignIn fallbackRedirectUrl={redirectUrl || "/"} />
    </div>
  );
}
