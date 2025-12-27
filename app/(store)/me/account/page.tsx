import { AddressManager } from "@/components/account/Address";
import ProfilePage from "@/components/account/Profile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cookies } from "next/headers";

const page = async () => {
  const cookieStore = await cookies();
  const token = await cookieStore.get("token")?.value;

  return (
    <div className="mt-5 max-w-screen-lg mx-auto px-4">
      <Tabs defaultValue="account" className="mb-4">
        <TabsList className="grid w-full grid-cols-4 capitalize font-semibold text-lg">
          <TabsTrigger
            value="account"
            className="data-[state=active]:text-[#4A90E2] data-[state=active]:bg-white data-[state=active]:border-b-2 border-b-[#4A90E2]"
          >
            Account
          </TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <ProfilePage token={token!} />
        </TabsContent>
        <TabsContent value="addresses">
          <AddressManager token={token!} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default page;
