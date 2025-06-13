"use client";
// import { ThemeButton } from "./theme-button";
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
import { useBoolean } from "@/Hooks/useBoolean";
import MenuButton from "./menuButton";
import MobileNav from "./mobileNav";
import { Data, ProductsConnection, Shoplist } from "@/types";
import { useCartStore } from "@/store/cart-store";
import { SearchIcon } from "lucide-react";
import { Input } from "../ui/input";
import { useMemo, useRef, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { GET_SEARCH } from "@/lib/query";
import Image from "next/image";
import { formatCurrencyValue } from "@/utils/format-currency-value";
import UserButton from "./user-button";
import useSWR from "swr";
import { Cart, CartItem } from "@prisma/client";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    const error: any = new Error(data.error || "Failed to fetch data.");
    error.status = res.status;
    throw error;
  }
  return data;
};

type CartItems = Cart & {
  cartItems: CartItem[];
};

const Menu = () => {
  const [isOpen, setIsOpen] = useBoolean(false);
  function removeHyphens(slug: string) {
    const textWithoutHyphen = slug.replace(/-/g, " ");
    return textWithoutHyphen;
  }

  const { data: cart } = useSWR("/api/cart", fetcher);

  const items: CartItems = cart?.cart || [];
  // const { user } = useUser();
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<ProductsConnection>();

  const [getSearchedProducts, { loading, data: searchData }] =
    useLazyQuery<Data>(GET_SEARCH);

  const handleChange = useMemo(
    () => (e: any) => {
      setSearch(e.target.value);
      setTimeout(() => {
        getSearchedProducts({
          variables: { search: search, first: 20 },
          notifyOnNetworkStatusChange: true,
        }).then((res) => {
          setData(res?.data?.productsConnection);
        });
      }, 100);
    },
    [search]
  );

  return (
    <div
      className={`relative top-0 right-0 left-0 z-[20] bg-white shadow ${
        isOpen ? "h-full" : "h-fit"
      } md:h-fit`}
    >
      <div className="bg-black text-white text-center py-2">
        <p className="md:text-lg text-sm font-medium text-white">
          Sign up and get 20% off on your first order.{" "}
          <span className="uppercase underline inline-flex">sign up now</span>
        </p>
      </div>
      <div className="flex justify-between items-center p-2 py-4 max-w-screen-xl mx-auto gap-5">
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
                  <div className="grid p-4 gap-5">
                    {Shoplist.map((list) => (
                      <div key={list.title} className="flex flex-col space-y-1">
                        <NavigationMenuLink
                          href={`${list.link}`}
                          className="text-sm font-medium capitalize text-[#313133] text-ellipsis hover:text-gray-400"
                        >
                          {list.title}
                        </NavigationMenuLink>
                      </div>
                    ))}
                  </div>
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
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* <NavigationMenu className="hidden md:block uppercase text-center">
          <NavigationMenuList>
            <div className="flex flex-row gap-2">
              {Shoplist.map((list) => (
                <NavigationMenuItem
                  key={list.title}
                  className="uppercase hover:border-b-2 text-xs font-medium border-black"
                >
                  <Link href={`${list.link}`} legacyBehavior passHref>
                    <NavigationMenuLink
                      href={`${list.link}`}
                      className={navigationMenuTriggerStyle()}
                    >
                      {list.title}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              ))}
            </div>

            <NavigationMenuItem className="hover:border-b-2 text-xs font-medium border-black">
              <Link href="/top-deals" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  On Sale
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem className="hover:border-b-2 text-xs font-medium border-black">
              <Link href="/new-arrivals" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  New Arrivals
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu> */}
        <div className="lg:flex-1 hidden lg:block">
          <div className="w-full relative">
            <div className="flex border border-gray-200 rounded-full px-2 justify-between items-center gap-2">
              <SearchIcon className="w-5 h-5 text-gray-500" />
              <Input
                onChange={handleChange}
                value={search}
                ref={inputRef}
                placeholder="Search for products..."
                className="border-none w-full rounded-full p-1 focus-visible:ring-none focus-visible:ring-0 focus-visible:ring-gray-100"
              />
            </div>
            <div className="absolute top-10 left-0 w-full bg-white shadow-lg z-10 rounded-b-lg max-h-[50vh] overflow-y-auto">
              {loading ? (
                <div className="text-center font-semibold text-base">
                  searching...
                </div>
              ) : (
                <div>
                  {search && (
                    <div className="flex flex-col gap-4 divide-y-2 p-4">
                      {data?.edges?.map((item: any) => (
                        <div
                          className="flex items-center justify-between gap-4 pt-4"
                          key={item.node.id}
                          onClick={() => {
                            setSearch("");
                          }}
                        >
                          <Link
                            href={`/products/${item.node?.slug}`}
                            className="flex items-center gap-4"
                          >
                            <div className="relative">
                              <Image
                                className="w-14 h-14 object-cover rounded-lg"
                                src={item.node.images[0].url}
                                alt={item.node.productName}
                                width={500}
                                height={500}
                                priority
                              />
                            </div>

                            <div className="flex flex-col justify-between gap-4">
                              <span className="md:text-lg font-medium leading-tight line-clamp-1">
                                {removeHyphens(item.node.productName)}
                              </span>
                            </div>
                          </Link>

                          <div className="ml-2 ">
                            <span className="text-lg font-semibold">
                              {formatCurrencyValue(
                                item.node.discountedPrice || item.node.price
                              )}
                            </span>

                            {item.node.discountedPrice && (
                              <span className="line-through text-sm text-gray-500 decoration-gray-500 ml-2 dark:text-white dark:decoration-white">
                                {formatCurrencyValue(item.node.price)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center gap-2 md:gap-4">
          {/* <div className="lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <SearchIcon className="w-6 h-6 text-gray-500" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-w-screen-sm w-full mx-auto flex justify-center items-center">
                <Search />
              </DropdownMenuContent>
            </DropdownMenu>
          </div> */}
          <div className="block lg:hidden">
            <Search />
          </div>

          <Link href={"/cart"} className="relative">
            <CartIcon className="w-6 h-6 text-black" />
            {items?.cartItems?.length > 0 && (
              <div className="rounded-full bg-red-500 animate-bounce absolute top-0 right-0 size-2"></div>
            )}
          </Link>

          {/* <DropdownMenu>
            <DropdownMenuTrigger>
              <SignedIn>
                <div className="flex justify-center items-center gap-2">
                  <UserCheck2Icon className="w-6 h-6 text-black md:hidden block" />
                  <UserRound className="w-6 h-6 text-black hidden md:block" />
                  <h2 className="text-base font-semibold font-sans text-start capitalize text-black hidden md:block">
                    hi, {user?.username}
                  </h2>
                </div>
              </SignedIn>
              <SignedOut>
                <div className="flex justify-center items-center gap-1">
                  <UserRound className="w-6 h-6 text-black" />
                  <h2 className="text-base font-semibold font-sans text-start capitalize text-black hidden md:block">
                    account
                  </h2>
                </div>
              </SignedOut>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-1 space-y-1 lg:min-w-[200px]">
              <SignedOut>
                <Button className="bg-black text-white rounded-md flex flex-col justify-center items-center w-full">
                  <SignInButton></SignInButton>
                </Button>

                <DropdownMenuSeparator />
              </SignedOut>

              <DropdownMenuItem>
                <Link
                  href={""}
                  className="flex justify-start items-center gap-2 capitalize"
                >
                  <UserRound className="w-6 h-6 text-black" />
                  my account
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link
                  href={"/orders"}
                  className="flex justify-start items-center gap-2 capitalize"
                >
                  <ShoppingBagIcon className="w-6 h-6 text-black" />
                  orders
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <SignedIn>
                <Button className="bg-black text-white rounded-md flex flex-col justify-center items-center w-full">
                  <SignOutButton />
                </Button>
              </SignedIn>
            </DropdownMenuContent>
          </DropdownMenu> */}
          <UserButton />
          {/* <ThemeButton /> */}
        </div>
      </div>

      {/* mobile nav */}
      {isOpen && <MobileNav onClose={setIsOpen.toggle} />}
    </div>
  );
};

export default Menu;
