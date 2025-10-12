import VerificationForm from "@/components/dashboard/verification-form";
import { cookies } from "next/headers";
import React from "react";

const StoreLogin = async () => {
  const cookieStore = await cookies();
  const storeToken = cookieStore.get("store-token")?.value;

  return (
    <div>
      <VerificationForm storeToken={storeToken} />
    </div>
  );
};

export default StoreLogin;
