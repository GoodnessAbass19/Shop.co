"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// import UserIcon from "../Icons/userIcon";
import { Button } from "../ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  CircleUserRound,
  Settings,
  ShoppingBagIcon,
  Store,
  UserCheck2Icon,
  UserRound,
  UserRoundCheck,
} from "lucide-react";
import { User } from "@prisma/client";
import LogoutButton from "./logout-button";
import { ClipLoader } from "react-spinners";

const UserButton = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true); // Set loading to true when starting fetch
    fetch("/api/me")
      .then((res) => {
        if (!res.ok) {
          // If response is not OK (e.g., 401 Unauthorized), the user is not logged in.
          // Don't throw an error, just set user to null.
          return { user: null };
        }
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
      })
      .catch((err) => {
        // This catch block is for network errors or parsing errors
        console.error("Failed to fetch user:", err);
        setUser(null); // Ensure user is null on error
      })
      .finally(() => {
        setIsLoading(false); // Always set loading to false after fetch attempt
      });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center bg-gray-100">
        <ClipLoader
          color={"#000"} // Customize the color as needed
          loading={isLoading}
          // cssOverride={override}
          size={15}
          aria-label="Loading Spinner"
          data-testid="loader"
        />
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      {user?.role === "SELLER" && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={"/your/store/dashboard"}>
                <Store />
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p className="capitalize">shop manager</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex justify-center items-center hover:cursor-pointer">
              <UserCheck2Icon className="w-6 h-6 text-black md:hidden block" />
              <UserRoundCheck className="w-6 h-6 text-black hidden md:block" />
              {/* <h2 className="text-base font-semibold font-sans text-start capitalize text-black hidden md:block">
                hi, {user?.name}
              </h2> */}
              <ChevronDown className="w-4 h-4" />
            </div>

            {/* <Button variant="ghost" size="icon">
          <UserIcon className="w-6 h-6 text-black" />
        </Button> */}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="space-y-2 p-1">
            {user ? (
              <>
                <DropdownMenuItem>
                  <Link
                    href={""}
                    className="flex justify-between items-center gap-3 capitalize"
                  >
                    <UserRound className="w-5 h-5 text-black" />
                    <div className="flex flex-col justify-start items-start text-xs">
                      <span className="font-semibold capitalize text-base text-black">
                        {user.name}
                      </span>
                      view your profile
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link
                    href={"/me/orders"}
                    className="flex justify-start items-center gap-2 capitalize"
                  >
                    <ShoppingBagIcon className="w-5 h-5 text-black" />
                    orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {user.role !== "SELLER" && (
                  <>
                    <DropdownMenuItem>
                      <Link
                        href={"/orders"}
                        className="flex justify-start items-center gap-2 capitalize"
                      >
                        <Store className="w-5 h-5 text-black" />
                        sell on shop.co
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuItem>
                  <Link
                    href={"/me/account"}
                    className="flex justify-between items-center gap-3 capitalize"
                  >
                    <Settings className="w-5 h-5 text-black" />
                    <div className="flex flex-col justify-start items-start">
                      Account settings
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  {/* <form action="/api/logout" method="GET">
                  <button type="submit" className="w-full text-left">
                    Logout
                  </button>
                </form> */}
                  <LogoutButton />
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem asChild>
                <Link href="/sign-in">
                  <Button className="w-full bg-black text-white">Login</Button>
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        // <div className="flex justify-center items-center gap-1">
        //   <UserRound className="w-6 h-6 text-black" />
        <Link
          href="/sign-in"
          className="text-base font-semibold font-sans text-start capitalize text-black hidden md:block rounded-full hover:bg-gray-200 p-1"
        >
          sign in
        </Link>

        // </div>
      )}
    </div>
  );
};

export default UserButton;
