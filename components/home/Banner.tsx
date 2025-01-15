import Image from "next/image";
import React from "react";
import { Button } from "../ui/button";
import Marquee from "react-fast-marquee";

const images = [
  "/images/versace.png",
  "/images/gucci.png",
  "/images/prada.png",
  "/images/calvin.png",
  "/images/zara.png",
];

const Banner = () => {
  return (
    <div className="">
      <div className="max-w-screen-2xl mx-auto pt-5">
        <div className="grid grid-cols-1 md:grid-cols-2 justify-between items-center gap-10">
          <div className="flex flex-col items-stretch justify-start gap-7 px-5">
            <h2 className="lg:text-7xl text-4xl font-extrabold uppercase">
              find clothes that matches your style
            </h2>

            <p className="text-lg font-medium text-start">
              Browse through our diverse range of meticulously crafted garments,
              designed to bring out your individuality and cater to your sense
              of style
            </p>

            <Button
              variant={"outline"}
              className="bg-black dark:bg-white rounded-full p-6 shadow text-lg font-bold uppercase text-white dark:text-black w-full"
            >
              shop now
            </Button>

            <div className="flex flex-wrap md:justify-between justify-around items-center space-x-5 w-full">
              <div className="flex justify-start items-start flex-col">
                <h3 className="lg:text-4xl text-2xl font-medium">200+</h3>
                <span className="text-base capitalize">
                  international brands
                </span>
              </div>
              <div className="flex justify-start items-start flex-col">
                <h3 className="lg:text-4xl text-2xl font-medium">2000+</h3>
                <span className="text-base capitalize">
                  high quality products
                </span>
              </div>
              <div className="flex justify-start items-start flex-col">
                <h3 className="lg:text-4xl text-2xl font-medium">30,000+</h3>
                <span className="text-base capitalize">happy customers</span>
              </div>
            </div>
          </div>

          <div>
            <Image
              src={"/Rectangle 2.png"}
              alt="banner"
              width={500}
              height={500}
              className="object-cover object-center w-full h-full"
            />
          </div>
        </div>
      </div>
      <div className="bg-black w-full py-3">
        <Marquee speed={70} className="max-w-screen-2xl mx-auto">
          <div className="flex justify-between items-center gap-10">
            {images.map((item) => (
              <Image
                src={item}
                alt="brand"
                width={500}
                height={500}
                className="w-full h-full"
                key={item}
                priority
              />
            ))}
          </div>
        </Marquee>
      </div>
    </div>
  );
};

export default Banner;
