import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserIcon from "../Icons/userIcon";
import { Button } from "../ui/button";
import { SignInButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

const UserButton = async () => {
  const user = await currentUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <UserIcon className="w-6 h-6 text-black" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-1 space-y-1">
        <Button className="bg-black text-white rounded-md flex flex-col justify-center items-center w-full">
          <SignInButton />
        </Button>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Orders</DropdownMenuItem>
        {/* <DropdownMenuItem>Team</DropdownMenuItem>
      <DropdownMenuItem>Subscription</DropdownMenuItem> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserButton;
