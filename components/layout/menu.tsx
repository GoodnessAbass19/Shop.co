"use client";
import { useState } from "react";
import MenuIcon from "../Icons/menuIcon";
import { ThemeButton } from "./theme-button";
import CloseIcon from "../Icons/closeIcon";
import Image from "next/image";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import Search from "./Search";
import CartIcon from "../Icons/cartIcon";
import UserIcon from "../Icons/userIcon";
import { useBoolean } from "@/Hooks/useBoolean";
import MenuButton from "./menuButton";
import MobileNav from "./mobileNav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SearchIcon from "../Icons/searchIcon";

const Menu = () => {
  const [isOpen, setIsOpen] = useBoolean(false);

  return (
    <div
      className={`relative top-0 right-0 left-0 z-[60] bg-white shadow ${
        isOpen ? "h-full" : "h-fit"
      } md:h-fit`}
    >
      <div className="bg-black text-white text-center py-2">
        <p className="md:text-lg text-sm font-medium text-white">
          Sign up and get 20% off on your first order.{" "}
          <span className="uppercase underline inline-flex">sign up now</span>
        </p>
      </div>
      <div className="flex justify-between items-center p-2 py-4 max-w-screen-2xl mx-auto gap-5">
        <div className="flex justify-between items-center md:gap-x-5 gap-x-3">
          <div className="md:hidden">
            <MenuButton isOpen={isOpen} onClick={setIsOpen.toggle} />
          </div>

          <Link
            href={"/"}
            className="text-black lg:text-3xl md:text-2xl text-xl font-extrabold uppercase"
          >
            shop.co
          </Link>

          <NavigationMenu className="hidden md:block">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Shop</NavigationMenuTrigger>
                <NavigationMenuContent>
                  Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                  Aperiam nam dolores reprehenderit quibusdam facere ratione
                  voluptatibus necessitatibus iste? Officia deleniti quod,
                  aliquam iste velit quae aliquid delectus soluta adipisci
                  explicabo.
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/top-deals" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    On Sale
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/new-arrivals" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    New Arrivals
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="#" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Brands
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="lg:flex-1 hidden lg:block">
          <Search />
        </div>
        <div className="flex justify-between items-center gap-2 md:gap-4">
          <div className="lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <SearchIcon className="w-6 h-6 text-gray-500" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-w-screen-sm w-full mx-auto flex justify-center items-center">
                <Search />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Link href={"#"}>
            <CartIcon className="w-6 h-6 text-black" />
          </Link>
          <Link href={"#"}>
            <UserIcon className="w-6 h-6 text-black" />
          </Link>
          <ThemeButton />
        </div>
      </div>

      {/* mobile nav */}
      {isOpen && <MobileNav onClose={setIsOpen.toggle} />}
    </div>
  );
};

export default Menu;
