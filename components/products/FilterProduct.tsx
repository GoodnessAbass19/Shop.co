"use client";

import React, { useMemo, useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

// Shadcn UI Components
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";

import ProductCard from "./productCard";
import Pagination from "../ui/Pagination";
import { formatCurrencyValue } from "../../utils/format-currency-value";

// --- Sub-components ---

const CategorySelect = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => {
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      const d = await res.json();
      return d.categories || d;
    },
  });

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Category</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {Array.isArray(categories) &&
            categories.map((c: any) => (
              <SelectItem key={c.id || c.slug} value={String(c.id || c.slug)}>
                {c.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// --- Main Component ---

interface FilterProductProps {
  title: string;
  url?: string;
  tag?: string | string[];
}

const FilterProduct: React.FC<FilterProductProps> = ({ title, url, tag }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 1. Extract values from URL
  const currentSort = searchParams.get("sort") || "newest";
  const currentMin = Number(searchParams.get("min")) || 0;
  const currentMax = Number(searchParams.get("max")) || 10000;
  const currentCategory = searchParams.get("categoryId") || "all";
  const currentRating = searchParams.get("rating") || "all";
  const currentPage = Number(searchParams.get("page")) || 1;

  // 2. Local state for the Slider (to allow smooth dragging without instant API calls)
  const [sliderValue, setSliderValue] = useState<[number, number]>([
    currentMin,
    currentMax,
  ]);

  // Sync slider if URL changes (e.g., on Reset)
  useEffect(() => {
    setSliderValue([currentMin, currentMax]);
  }, [currentMin, currentMax]);

  // 3. Helper to update URL
  const updateQuery = useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "all" || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      // Always reset to page 1 when filters change, unless explicitly setting page
      if (!updates.page) params.delete("page");

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  // 4. Debounced Slider Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sliderValue[0] !== currentMin || sliderValue[1] !== currentMax) {
        updateQuery({ min: sliderValue[0], max: sliderValue[1] });
      }
    }, 500); // Wait 500ms after user stops sliding
    return () => clearTimeout(timer);
  }, [sliderValue, currentMin, currentMax, updateQuery]);

  // 5. Fetching Data
  const fetchUrl = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (tag) params.set("tag", String(tag));
    const base = url
      ? url.startsWith("/api")
        ? url
        : `/api/products/${url}`
      : `/api/products`;
    return `${base}${base.includes("?") ? "&" : "?"}${params.toString()}`;
  }, [url, searchParams, tag]);

  const {
    data: productsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["products", fetchUrl],
    queryFn: async () => {
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const FiltersContent = () => (
    <div className="space-y-8">
      <CategorySelect
        value={currentCategory}
        onChange={(v) => updateQuery({ categoryId: v })}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Price Range</Label>
          <span className="text-xs font-mono bg-secondary px-2 py-1 rounded">
            {formatCurrencyValue(sliderValue[0])} —{" "}
            {formatCurrencyValue(sliderValue[1])}
          </span>
        </div>
        <Slider
          min={0}
          max={100000000}
          step={100}
          value={sliderValue}
          onValueChange={(vals) => setSliderValue(vals as [number, number])}
          className="py-4"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Minimum Rating</Label>
        <Select
          value={currentRating}
          onValueChange={(v) => updateQuery({ rating: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Rating</SelectItem>
            <SelectItem value="4">4+ Stars</SelectItem>
            <SelectItem value="3">3+ Stars</SelectItem>
            <SelectItem value="2">2+ Stars</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="outline"
        className="w-full gap-2 border-dashed"
        onClick={() => router.push(pathname)}
      >
        <RotateCcw className="w-4 h-4" /> Reset All Filters
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto py-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#0d131b] capitalize">
            {title}
          </h1>
          <p className="text-muted-foreground mt-2">
            Found {productsData?.total || 0} products matching your criteria
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden">
                <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <SheetHeader className="text-left">
                <SheetTitle className="text-2xl">Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-8">
                <FiltersContent />
              </div>
            </SheetContent>
          </Sheet>

          <Select
            value={currentSort}
            onValueChange={(v) => updateQuery({ sort: v })}
          >
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="rating">Top Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-10">
        {/* Desktop Sidebar */}

        <aside className="hidden md:block col-span-1 space-y-8 h-fit sticky top-24">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="h-4 w-4" />
            <h3 className="font-bold uppercase tracking-wider text-sm">
              Refine Results
            </h3>
          </div>
          <FiltersContent />
        </aside>

        {/* Product Grid */}
        <main className="md:col-span-3 lg:col-span-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] w-full rounded-2xl" />
              ))}
            </div>
          ) : error ? (
            <div className="p-12 text-center border-2 border-dashed rounded-3xl">
              <p className="text-destructive font-medium">
                Something went wrong fetching products.
              </p>
              <Button variant="link" onClick={() => window.location.reload()}>
                Try again
              </Button>
            </div>
          ) : productsData?.products?.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-xl text-muted-foreground">
                No products found.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push(pathname)}
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
              {productsData.products.map((p: any) => (
                <ProductCard key={p.id} item={p} loading />
              ))}
            </div>
          )}

          <div className="mt-16 flex justify-center border-t pt-8">
            <Pagination
              count={productsData?.total || 0}
              page={currentPage}
              // onChange={(p: number) => updateQuery({ page: p })}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default FilterProduct;
