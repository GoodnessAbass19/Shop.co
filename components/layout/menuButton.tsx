"use client";

import CloseIcon from "../Icons/closeIcon";
import MenuIcon from "../Icons/menuIcon";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  isOpen: boolean;
  onClick: () => void;
}

const variants = {
  hidden: { y: -20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
  exit: { y: 20, opacity: 0 },
};

const MenuButton = ({ isOpen, onClick, ...props }: Props) => {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {isOpen !== undefined &&
        (!isOpen ? (
          // {/*------------------*/}
          // {/*---- menu icon----*/}
          <motion.button
            className=""
            aria-label="open menu"
            variants={variants}
            key="open"
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.05 }}
            onClick={onClick}
          >
            <MenuIcon className="w-6 h-6 text-black dark:text-white" />
          </motion.button>
        ) : (
          // {/*-------------------*/}
          // {/*---- close icon----*/}
          <motion.button
            aria-label="close menu"
            variants={variants}
            key="close"
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.05 }}
            onClick={onClick}
            className=""
          >
            <CloseIcon className="w-6 h-6 text-black dark:text-white" />
          </motion.button>
        ))}
    </AnimatePresence>
  );
};

export default MenuButton;
