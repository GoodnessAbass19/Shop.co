"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const MobileNav = ({ onClose }: { onClose: () => void }) => {
  // const { socialMedia } = footerData;
  return (
    <div
      className="fixed inset-0 z-40 !min-h-full bg-black/40 mt-24"
      onClick={onClose}
    >
      <motion.nav
        className="!min-h-full w-3/4 flex flex-col justify-between bg-white md:hidden "
        variants={navVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <motion.ul
          className="container flex flex-col gap-6  px-6 pt-10 border-t text-lg font-medium capitalize tracking-widest text-gray-500"
          variants={ulVariants}
        >
          {navItems.map((item, index) => (
            <motion.li
              key={index}
              className="list-none text-start text-black"
              variants={listVariants}
              initial="hidden"
              whileInView="visible"
              exit="exit"
              custom={index}
              onClick={onClose}
            >
              <Link href={`/${item.path}`} className="inline-block text-base">
                {item.name}
              </Link>
            </motion.li>
          ))}
        </motion.ul>

        <motion.div
          className="flex justify-center gap-4 px-6 pb-4"
          variants={listVariants}
          initial="hidden"
          whileInView="visible"
          exit="exit"
          custom={3}
        ></motion.div>
      </motion.nav>
    </div>
  );
};

// framer motion animation variants
const navVariants = {
  hidden: {
    x: -100,
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      ease: "easeInOut",
    },
  },
  exit: {
    x: 100,
    opacity: 0,
    transition: {},
  },
};
const ulVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      type: "spring",
      delay: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: { ease: "easeInOut" },
  },
};
const listVariants = {
  hidden: {
    y: 10,
    opacity: 0,
  },
  visible: (index: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      delay: index * 0.1,
    },
  }),
  exit: (index: number) => ({
    y: -10,
    opacity: 0,
    transition: {
      delay: index * 0.1,
    },
  }),
};

const navItems = [
  {
    name: "Men's Fashion",
    path: "mens-fashion",
  },
  {
    name: "Women's fashion",
    path: "womens-fashion",
  },
  {
    name: "Kid's fashion",
    path: "kids-fashion",
  },
];

export default MobileNav;
