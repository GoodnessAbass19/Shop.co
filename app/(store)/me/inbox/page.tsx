import BuyerNotifications from "@/components/account/Notifications";
import { cookies } from "next/headers";
import React from "react";

const page = async () => {
  const cookieStore = await cookies();
  const token = await cookieStore.get("token")?.value;

  return (
    <div>
      <BuyerNotifications token={token!} />
    </div>
  );
};

export default page;
