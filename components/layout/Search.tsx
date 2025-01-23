"use client";
import SearchIcon from "../Icons/searchIcon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "../ui/input";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { GET_SEARCH } from "@/lib/query";
import Image from "next/image";
import Link from "next/link";
import { formatCurrencyValue } from "@/utils/format-currency-value";
import { Data, ProductEdge, ProductsConnection } from "@/types";
import { useRouter } from "next/navigation";
import { useBoolean } from "@/Hooks/useBoolean";

const Search = () => {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useBoolean(false);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const [data, setData] = useState<ProductsConnection>();

  const [getSearchedProducts, { loading, data: searchData }] =
    useLazyQuery<Data>(GET_SEARCH);

  console.log(searchData);
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
    <Dialog>
      <DialogTrigger>
        <SearchIcon className="w-5 h-5 text-gray-500" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md md:max-w-2xl max-w-xs max-h-[80svh] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>Search for products</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <div className="w-full">
          <div className="flex border border-gray-200 rounded-full px-2 justify-between items-center gap-2">
            <SearchIcon className="w-5 h-5 text-gray-500" />
            <Input
              onChange={handleChange}
              value={search}
              ref={inputRef}
              className="border-none w-full rounded-full p-1 focus-visible:ring-none focus-visible:ring-0 focus-visible:ring-gray-100"
            />
          </div>
        </div>
        {loading ? (
          <div className="text-center font-semibold text-base">searhing...</div>
        ) : (
          <div>
            {search && (
              <div className="flex flex-col gap-4 divide-y-2">
                {data?.edges?.map((item: ProductEdge) => (
                  <div
                    className="flex items-center justify-between gap-4 pt-4"
                    key={item.node.id}
                    onClick={() => {
                      setSearch("");
                    }}
                  >
                    <DialogClose>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Link href={`/products/${item.node?.slug}`}>
                            <Image
                              className="w-10 h-10 object-cover rounded"
                              src={item.node.images[0].url}
                              alt={item.node.productName}
                              width={500}
                              height={500}
                              priority
                            />
                          </Link>
                        </div>

                        <div className="flex flex-col justify-between gap-4">
                          <Link href={`/products/${item.node?.slug}`}>
                            <span className="md:text-lg font-medium leading-tight line-clamp-1">
                              {item.node.productName}
                            </span>
                          </Link>
                        </div>
                      </div>

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
                    </DialogClose>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Search;
