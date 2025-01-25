import Link from "next/link";
import EmptyCartIcon from "../ui/EmptyCartIcon";

export default function CartEmpty() {
  return (
    <div className="flex flex-col items-center wrapper py-6">
      <EmptyCartIcon />
      <div className="mt-10 w-full flex justify-center">
        <Link
          className="flex items-center justify-center w-full max-w-[170px] md:min-w-[157px] h-10 text-sm bg-black text-white dark:bg-white dark:text-black rounded trans-150"
          href={"/"}
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
