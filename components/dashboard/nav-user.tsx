"use client";

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  DoorOpen,
  LogOut,
  Sparkles,
  User,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn, getInitials } from "@/lib/utils";
import { HoverPrefetchLink } from "@/lib/HoverLink";
import { usePathname, useRouter } from "next/navigation";

export function NavUser({
  name,
  email,
  avatar,
}: {
  name: string;
  email: string;
  avatar: string;
}) {
  const { isMobile } = useSidebar();
  const pathname = usePathname();

  const router = useRouter();

  const handleLogout = async () => {
    // await fetch("/api/logout", { method: "GET" });
    // Refresh the page to update the UI
    // localStorage.removeItem("token"); // Clear token from local storage if used
    router.prefetch("/");
    router.push("/"); // Redirect to login or home
    // router.refresh();
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage
                  src={avatar}
                  alt={name}
                  className="object-cover object-center aspect-square"
                />
                <AvatarFallback className="rounded-full uppercase">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="truncate text-xs">{email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage
                    src={avatar}
                    alt={name}
                    className="object-cover object-center aspect-square"
                  />
                  <AvatarFallback className="rounded-full">
                    {getInitials(name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  <span className="truncate text-xs">{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <HoverPrefetchLink
                  href={"/your/store/dashboard/profile"}
                  className={cn(
                    "w-full flex justify-start items-center gap-2 transition-colors duration-200",
                    // Highlight active HoverPrefetchLink based on pathname.startsWith for nested routes
                    pathname === ""
                      ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                      : ""
                  )}
                >
                  <User />
                  Profile
                </HoverPrefetchLink>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {/* <DropdownMenuItem
              onClick={handleLogout}
              className="hover:text-red-600 "
            >
              <DoorOpen />
              Exit Store
            </DropdownMenuItem> */}
            <DropdownMenuItem
              onClick={handleLogout}
              className="hover:text-red-600 "
            >
              <LogOut />
              Exit Store
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
