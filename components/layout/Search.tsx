"use client";
import SearchIcon from "../Icons/searchIcon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Copy } from "lucide-react";

const Search = () => {
  return (
    <Dialog>
      <DialogTrigger>
        <SearchIcon className="w-5 h-5 text-gray-500" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md md:max-w-xl max-w-xs">
        <DialogHeader>
          <DialogTitle>Search for products</DialogTitle>
        </DialogHeader>
        <div className="w-full">
          <div className="flex border border-gray-200 rounded-full px-2 justify-between items-center gap-2">
            <SearchIcon className="w-5 h-5 text-gray-500" />
            <Input className="border-none w-full rounded-full p-1 focus-visible:ring-none focus-visible:ring-0 focus-visible:ring-gray-100" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Search;
