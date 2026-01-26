import Image from "next/image";
import React from "react";
import { Button } from "../ui/button";
import BannerImg from "@/public/Images/hero.png";
import Link from "next/link";
import { ArrowRight, Sparkles, ShoppingBag, Truck } from "lucide-react";

const Banner = () => {
  const stats = [
    { number: "200+", label: "Premium Brands" },
    { number: "50K+", label: "Products" },
    { number: "100K+", label: "Happy Customers" },
  ];

  const categories = [
    { name: "Men's Fashion", emoji: "👔" },
    { name: "Women's Fashion", emoji: "👗" },
    { name: "Accessories", emoji: "✨" },
  ];

  return (
    <div className="w-full">
      {/* Main Hero Section */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[300px]">
          {/* Left Content */}
          <div className="flex flex-col justify-start gap-6 md:gap-8">
            {/* Badge */}
            <div className="flex items-center gap-2 w-fit">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                Exclusive Collection Available
              </span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight">
                <span className="bg-gradient-to-r from-black via-gray-800 to-gray-600 dark:from-white dark:via-gray-300 dark:to-gray-400 bg-clip-text text-transparent">
                  Discover Your
                </span>
                <br />
                <span className="text-black dark:text-white">Style Today</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-lg leading-relaxed">
                Explore our curated collection of premium fashion and
                accessories from top brands worldwide. Find the perfect pieces
                to express your unique style.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/c" className="w-full sm:w-auto">
                <Button className="w-full bg-black hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black rounded-full px-8 py-6 text-lg font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <ShoppingBag className="w-5 h-5" />
                  Explore Now
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full sm:w-auto rounded-full px-8 py-6 text-lg font-bold border-2 hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                View Collections
              </Button>
            </div>

            {/* Features */}
            <div className="flex flex-col sm:flex-row gap-6 pt-8 border-t dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Free Shipping</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    On orders over $50
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Premium Quality</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Handpicked items
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="w-full md:w-1/2 lg:w-3/5 aspect-[4/3] md:aspect-auto md:h-[400px] rounded-xl bg-gray-200 dark:bg-gray-700 relative group overflow-hidden mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-3xl blur-3xl opacity-40"></div>
            <Image
              src={
                "https://lh3.googleusercontent.com/aida-public/AB6AXuAm0VSMqxyGdE8-y0UbXemp-zdygQlCUcfi1gdJ2gwMbmRhjcK_J08i4LuSsHlXhNdaQMd8zwZGTBx2TNt-vQLvnGEBCGJuIZSkYSX5HxOGbX1fvLZVu5RDElfoeWSWc01YYTRoFfwSC6kW-cNJrclfzirXUXOIRbx2deVvdItYr7kgv93fpweSkmJVM4BTTYv6U0O3pjFBB3-vLCjF-d-ImsemYHDzBm5ZYxVa8ezJr0g3v26Z6i5rZNlR7irljQPicGNPhjfeHQ"
              }
              alt="Fashion Banner"
              width={600}
              height={600}
              priority
              className="object-cover object-center w-full h-full rounded-2xl relative z-10 shadow-2xl"
            />
          </div>
        </div>
      </div>

      {/* Category Showcase */}
      {/* <div className="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Shop by Category
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Find exactly what you're looking for
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.name}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-8 hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <div className="absolute top-4 right-4 text-4xl">
                {category.emoji}
              </div>
              <h3 className="text-2xl font-bold mb-2">{category.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Explore our collection
              </p>
              <div className="flex items-center gap-2 text-black dark:text-white font-semibold group-hover:translate-x-2 transition-transform">
                Shop <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      </div> */}

      {/* Stats Section */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <div className="bg-gradient-to-r from-black to-gray-900 dark:from-gray-900 dark:to-black rounded-3xl p-8 md:p-12 text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center space-y-2">
                <h4 className="text-4xl md:text-5xl font-black">
                  {stat.number}
                </h4>
                <p className="text-gray-300">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
