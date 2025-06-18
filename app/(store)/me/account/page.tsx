import { AddressManager } from "@/components/account/Address";
import ProfilePage from "@/components/account/Profile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const page = () => {
  return (
    <div className="mt-5 max-w-screen-lg mx-auto px-4">
      <Tabs defaultValue="account" className="mb-4">
        <TabsList className="grid w-full grid-cols-4 capitalize font-semibold text-lg">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <ProfilePage />
        </TabsContent>
        <TabsContent value="addresses">
          <AddressManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default page;
