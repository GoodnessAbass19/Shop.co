import React from "react";
import { Input } from "../ui/input";
import SearchIcon from "../Icons/searchIcon";

const Search = () => {
  return (
    <div>
      <div className="flex border border-gray-200 rounded-full px-2 justify-between items-center gap-2">
        <SearchIcon className="w-5 h-5 text-gray-500" />
        <Input className="border-none w-full rounded-full p-1 focus-visible:ring-none focus-visible:ring-0 focus-visible:ring-gray-100" />
      </div>
    </div>
  );
};

export default Search;
