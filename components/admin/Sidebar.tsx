import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import React from "react";
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
  useSidebar,
} from "../ui/sidebar";
import {
  Banknote,
  Bike,
  Blocks,
  ChartNoAxesCombined,
  Grid2X2,
  House,
  Moon,
  Store,
  StoreIcon,
  Sun,
  UsersRound,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Switch } from "../ui/switch";
import {
  BuildingStorefrontIcon,
  Cog8ToothIcon,
} from "@heroicons/react/24/solid";
import { NavUser } from "../dashboard/nav-user";

const navItems = {
  management: [
    {
      name: "Dashboard",
      icon: Grid2X2,
      href: "/admin/dashboard",
    }, // Using StoreIcon for general dashboard
    {
      name: "Stores",
      icon: BuildingStorefrontIcon,
      href: "/admin/dashboard/store-management",
    },

    // {
    //   name: "Sellers",
    //   icon: UsersRound,
    //   href: "/admin/dashboard/seller-management",
    // },
    { name: "Riders", icon: Bike, href: "/admin/dashboard/rider-management" },
    {
      name: "Catalog & Products",
      icon: Blocks,
      href: "/admin/dashboard/catalog-products",
    },
  ],

  financials: [
    {
      name: "Commissions",
      icon: Banknote,
      href: "/admin/dashboard/commissions",
    },
    { name: "Payouts", icon: Wallet, href: "/admin/dashboard/payouts" },
  ],
};

interface SidebarProps {
  name: string;
  email: string;
  props?: React.ComponentProps<typeof Sidebar>;
}

const AdminSidebar = ({ name, email, ...props }: SidebarProps) => {
  const pathname = usePathname();
  // const [isOpen, setIsOpen] = useState(false);
  const { setTheme, theme } = useTheme();
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon">
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
              <h2 className="text-xl font-extrabold capitalize">
                Shop co Admin
              </h2>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase font-medium">
            management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.management.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "w-full flex justify-start items-center px-4 py-3 rounded-lg text-lg font-medium transition-colors duration-200",
                        // Highlight active HoverPrefetchLink based on pathname.startsWith for nested routes
                        pathname === item.href
                          ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                          : "",
                      )}
                    >
                      <item.icon className="w-7 h-7" />
                      {item.name}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase font-medium">
            financials
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.financials.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "w-full flex justify-start items-center px-4 py-3 rounded-lg text-lg font-medium transition-colors duration-200",
                        // Highlight active HoverPrefetchLink based on pathname.startsWith for nested routes
                        pathname === item.href
                          ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                          : "",
                      )}
                    >
                      <item.icon className="w-7 h-7" />
                      {item.name}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    href={"/admin/dashboard/analytics"}
                    className={cn(
                      "w-full flex justify-start items-center px-4 py-3 rounded-lg text-lg font-medium transition-colors duration-200",
                      // Highlight active HoverPrefetchLink based on pathname.startsWith for nested routes
                      pathname === "/admin/dashboard/analytics"
                        ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                        : "",
                    )}
                  >
                    <ChartNoAxesCombined className="w-7 h-7" />
                    Analytics
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
                  {open ? (
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
                          Light mode
                        </div>
                      )}

                      {/* </div> */}
                      <Switch
                        checked={theme === "dark"} // The switch is 'checked' if the theme is 'dark'
                        onCheckedChange={toggleTheme} // Calls the toggleTheme function when the switch state changes
                        className={cn()}
                      />
                    </div>
                  ) : (
                    <div>
                      {theme === "dark" ? (
                        <button
                          onClick={() => {
                            setTheme("light");
                          }}
                          className="bg-none outline-none rounded-none"
                        >
                          <Moon
                            className="w-5 h-5 text-gray-700 dark:text-gray-300"
                            fill="none"
                            stroke="currentColor"
                          />
                        </button>
                      ) : (
                        <button
                          onClick={() => setTheme("dark")}
                          className="bg-none outline-none rounded-none"
                        >
                          <Sun
                            className="w-5 h-5 text-yellow-500"
                            fill="#eab308"
                            stroke="currentColor"
                          />
                        </button>
                      )}
                    </div>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    href={"/admin/dashboard/settings"}
                    className={cn(
                      "w-full flex justify-start items-center px-4 py-3 rounded-lg text-lg font-medium transition-colors duration-200",
                      // Highlight active HoverPrefetchLink based on pathname.startsWith for nested routes
                      pathname === "/admin/dashboard/settings"
                        ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                        : "",
                    )}
                  >
                    <Cog8ToothIcon className="w-7 h-7" />
                    Settings
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser name={name} avatar="" email={email} />
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
