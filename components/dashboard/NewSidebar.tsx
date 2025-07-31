import {
  BarChart,
  Calendar,
  ChevronDown,
  ChevronUp,
  Home,
  Inbox,
  LogOut,
  Moon,
  Package,
  Percent,
  Search,
  Settings,
  ShoppingBag,
  StoreIcon,
  Sun,
  SunMoon,
  User2,
  Warehouse,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { HoverPrefetchLink } from "@/lib/HoverLink";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import Image from "next/image";
import { Button } from "../ui/button";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn, getInitials } from "@/lib/utils";
import { Switch } from "../ui/switch";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NavUser } from "./nav-user";
import NotificationBell from "../seller/NotificationBell";

// Menu items.
const items = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
    title: "Inbox",
    url: "#",
    icon: Inbox,
  },
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
];

const ProfileLinks = [
  {
    name: "Settings",
    icon: Settings,
    href: "/your/store/dashboard/settings",
  },
  {
    name: "Profile",
    icon: User2,
    href: "/your/store/dashboard/profile",
  },
];

const navItems = [
  {
    name: "Dashboard",
    icon: StoreIcon,
    href: "/your/store/dashboard",
  }, // Using StoreIcon for general dashboard
  { name: "Products", icon: Package, href: "/your/store/dashboard/products" },
  { name: "Orders", icon: ShoppingBag, href: "/your/store/dashboard/orders" },
  {
    name: "Sales & Analytics",
    icon: BarChart,
    href: "/your/store/dashboard/sales-analytics",
  },
  {
    name: "Inventory",
    icon: Warehouse,
    href: "/your/store/dashboard/inventory",
  },
  { name: "Discounts", icon: Percent, href: "/your/store/dashboard/discounts" },
];

interface SidebarProps {
  storeName: string;
  email: string;
  logo: string;
  props?: React.ComponentProps<typeof Sidebar>;
}

export function AppSidebar({ storeName, email, logo, ...props }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { setTheme, theme } = useTheme();
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };
  // Close sidebar on route change for mobile
  //   useEffect(() => {
  //     if (isSidebarOpen) {
  //       setIsSidebarOpen(false);
  //     }
  //   }, [pathname]); // Close sidebar when pathname changes

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      //   className="bg-white dark:bg-black text-black dark:text-white"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="sm"
              className="data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-start rounded-lg">
                <StoreIcon className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-extrabold capitalize">Seller Hub</h2>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase font-medium">
            marketing
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                    <HoverPrefetchLink
                      href={item.href}
                      className={cn(
                        "w-full flex justify-start items-center px-4 py-3 rounded-lg text-lg font-medium transition-colors duration-200",
                        // Highlight active HoverPrefetchLink based on pathname.startsWith for nested routes
                        pathname === item.href
                          ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                          : ""
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </HoverPrefetchLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <NotificationBell />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase font-medium">
            system
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <HoverPrefetchLink
                    href={"/your/store/dashboard/settings"}
                    className={cn(
                      "w-full flex justify-start items-center px-4 py-3 rounded-lg text-lg font-medium transition-colors duration-200 capitalize",
                      // Highlight active HoverPrefetchLink based on pathname.startsWith for nested routes
                      pathname === "/your/store/dashboard/settings"
                        ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                        : ""
                    )}
                  >
                    <Settings className="w-5 h-5" />
                    settings
                  </HoverPrefetchLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <div className="flex justify-between items-center px-3.5">
                    {/* <div className="flex justify-start items-center gap-1"> */}
                    {theme === "dark" ? (
                      <div className="flex justify-start items-center gap-1">
                        <Moon
                          className="w-5 h-5 mr-2 text-gray-700 dark:text-gray-300"
                          fill="none"
                          stroke="currentColor"
                        />
                        Dark mode
                      </div>
                    ) : (
                      <div className="flex justify-start items-center gap-1">
                        <Sun
                          className="w-5 h-5 mr-2 text-yellow-500"
                          fill="#eab308"
                          stroke="currentColor"
                        />
                        Dark mode
                      </div>
                    )}

                    {/* </div> */}
                    <Switch
                      checked={theme === "dark"} // The switch is 'checked' if the theme is 'dark'
                      onCheckedChange={toggleTheme} // Calls the toggleTheme function when the switch state changes
                    />
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser name={storeName} avatar={logo} email={email} />
      </SidebarFooter>
    </Sidebar>
  );
}
