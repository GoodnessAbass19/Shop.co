"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
import { Button } from "../ui/button";
import {
  Bike,
  ChevronDown,
  Heart,
  Settings,
  ShoppingBagIcon,
  Store,
  UserCheck2Icon,
  UserRound,
  UserRoundCheck,
} from "lucide-react";
import LogoutButton from "./logout-button";
import { ClipLoader } from "react-spinners";
import { HoverPrefetchLink } from "@/lib/HoverLink";
import UserNotificationBell from "./notification";
import { useUser } from "@/Hooks/user-context";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const UserButton = () => {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);

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
              <Link
                href={"/your/store/dashboard"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Store />
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p className="capitalize">shop manager</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {user?.role === "RIDER" && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={"/logistics/rider/dashboard"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src={"/images/motorsports.svg"}
                  alt="rider"
                  width={30}
                  height={30}
                />
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p className="capitalize">Switch to rider mode</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {user ? (
        <DropdownMenu open={open} onOpenChange={setOpen}>
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
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => setOpen(!open)}>
                  <HoverPrefetchLink
                    href={"/me/account"}
                    className="flex justify-between items-center gap-3 capitalize"
                  >
                    <UserRound className="w-5 h-5 text-black" />
                    <div className="flex flex-col justify-start items-start text-xs">
                      <span className="font-semibold capitalize text-base text-black">
                        {user.name}
                      </span>
                      view your profile
                    </div>
                  </HoverPrefetchLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setOpen(!open)}>
                  <HoverPrefetchLink
                    href={"/me/orders"}
                    className="flex justify-start items-center gap-2 capitalize"
                  >
                    <ShoppingBagIcon className="w-5 h-5 text-black" />
                    orders
                  </HoverPrefetchLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setOpen(!open)}>
                  <HoverPrefetchLink
                    href={"/me/orders"}
                    className="flex justify-start items-center gap-2 capitalize"
                  >
                    <UserNotificationBell />
                  </HoverPrefetchLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setOpen(!open)}>
                  <HoverPrefetchLink
                    href={"/me/wishlist"}
                    className="flex justify-start items-center gap-2 capitalize"
                  >
                    <Heart className="w-5 h-5 text-black" />
                    wishlist
                  </HoverPrefetchLink>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setOpen(!open)}>
                  <HoverPrefetchLink
                    href={"/me/account"}
                    className="flex justify-between items-center gap-3 capitalize"
                  >
                    <Settings className="w-5 h-5 text-black" />
                    <div className="flex flex-col justify-start items-start">
                      Account settings
                    </div>
                  </HoverPrefetchLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {user.role !== "SELLER" && user.role !== "RIDER" && (
                  <>
                    <DropdownMenuItem onSelect={() => setOpen(!open)}>
                      <button
                        onClick={() => router.push("/your/store/create")}
                        className="flex justify-start items-center gap-2 capitalize"
                      >
                        <Store className="w-5 h-5 text-black" />
                        sell on shop.co
                      </button>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {user.role !== "RIDER" && user.role !== "SELLER" && (
                  <>
                    <DropdownMenuItem onSelect={() => setOpen(!open)}>
                      <button
                        onClick={() => router.push("/logistics/rider/register")}
                        className="flex justify-start items-center gap-2 capitalize"
                      >
                        <Bike className="w-5 h-5 text-black" />
                        Become a shop.co rider
                      </button>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild onSelect={() => setOpen(!open)}>
                  {/* <form action="/api/logout" method="GET">
                  <button type="submit" className="w-full text-left">
                    Logout
                  </button>
                </form> */}
                  <LogoutButton />
                </DropdownMenuItem>
              </DropdownMenuGroup>
            ) : (
              <DropdownMenuItem asChild onSelect={() => setOpen(!open)}>
                <HoverPrefetchLink href="/sign-in">
                  <Button className="w-full bg-black text-white">Login</Button>
                </HoverPrefetchLink>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        // <div className="flex justify-center items-center gap-1">
        //   <UserRound className="w-6 h-6 text-black" />
        <Button
          variant={"outline"}
          className="block rounded-lg hover:bg-gray-200 p-1.5 border-black border"
        >
          <HoverPrefetchLink
            href="/sign-in"
            className="text-base font-semibold font-sans text-start capitalize text-black"
          >
            sign in
          </HoverPrefetchLink>
        </Button>

        // </div>
      )}
    </div>
  );
};

export default UserButton;
