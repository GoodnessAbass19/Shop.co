"use client";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { ChevronLeftIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const Pagination = ({ page, count }: { page: number; count: number }) => {
  const router = useRouter();

  const hasPrev = ITEM_PER_PAGE * (page - 1) > 0;
  const hasNext = ITEM_PER_PAGE * (page - 1) + ITEM_PER_PAGE < count;

  const changePage = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", newPage.toString());
    router.push(`${window.location.pathname}?${params}`);
  };

  return (
    <div className="p-4 flex items-center justify-center text-gray-500">
      {/* <p className="text-base font-normal text-[#4D44B5] hidden md:block opacity-0">
        {ITEM_PER_PAGE.toString()} of 50
      </p> */}
      <div className="flex justify-around items-center gap-2">
        <button
          disabled={!hasPrev}
          onClick={() => {
            changePage(page - 1);
          }}
          className="md:py-2 md:px-4 p-1 rounded-md bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {/* <Image
            src={"/icons/dropdown.png"}
            alt="next"
            width={24}
            height={24}
          /> */}
          <ChevronLeftIcon className="w-6 h-6 text-black" />
        </button>
        <div className="flex items-center gap-2 text-sm">
          {Array.from(
            { length: Math.ceil(count / ITEM_PER_PAGE) },
            (_, index) => {
              const pageIndex = index + 1;
              return (
                <button
                  key={pageIndex}
                  className={`px-2 rounded-sm ${
                    page === pageIndex
                      ? "px-2 rounded-full bg-black text-white p-1 w-8 h-8"
                      : "px-2 rounded-full p-1 w-8 h-8"
                  }`}
                  onClick={() => {
                    changePage(pageIndex);
                  }}
                >
                  {pageIndex}
                </button>
              );
            }
          )}
        </div>
        <button
          disabled={!hasNext}
          className="md:py-2 md:px-4 p-1 rounded-md bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => {
            changePage(page + 1);
          }}
        >
          {/* <Image
            src={"/icons/dropdown.png"}
            alt="next"
            width={24}
            height={24}
            className="rotate-180"
          /> */}
          <ChevronRightIcon className="w-6 h-6 text-black" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
