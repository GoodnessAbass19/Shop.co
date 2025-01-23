import Image from "next/image";
import Link from "next/link";
import React from "react";

const Styles = () => {
  return (
    <div className="mt-10 max-w-screen-xl mx-auto rounded-3xl bg-[#F0F0F0] space-y-10 py-5 text-black">
      <h2 className="uppercase text-3xl md:text-4xl font-extrabold text-center ">
        browse by dress style
      </h2>

      <div className="grid justify-center items-start w-full space-y-5 px-5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 justify-between items-stretch">
          <Link
            href={`/shop/casual`}
            className="col-span-2 relative overflow-hidden h-[290px] w-full"
          >
            <Image
              src={"/images/casual.png"}
              alt="casual"
              width={500}
              height={500}
              className="object-cover object-center w-full h-[290px] rounded-xl"
            />

            <span className="absolute top-2 left-2 capitalize text-3xl font-bold">
              casual
            </span>
          </Link>
          <div className="col-span-3 relative overflow-hidden h-[290px] w-full">
            <Image
              src={"/images/image 13.png"}
              alt="formal"
              width={500}
              height={500}
              className="object-cover object-left-top w-full h-full rounded-xl"
            />

            <span className="absolute top-2 left-2 capitalize text-3xl font-bold">
              formal
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 justify-between items-center">
          <div className="col-span-3 relative overflow-hidden h-[290px] w-full">
            <Image
              src={"/images/image 12.png"}
              alt="formal"
              width={500}
              height={500}
              className="object-cover object-left-top w-full h-full rounded-xl"
            />

            <span className="absolute top-2 left-2 capitalize text-3xl font-bold">
              party
            </span>
          </div>

          <div className="col-span-2 relative overflow-hidden h-[290px] w-full">
            <Image
              src={"/images/image 14.png"}
              alt="casual"
              width={500}
              height={500}
              className="object-cover object-center w-full h-[290px] rounded-xl"
            />

            <span className="absolute top-2 left-2 capitalize text-3xl font-bold">
              gym
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Styles;
