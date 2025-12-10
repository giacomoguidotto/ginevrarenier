"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

type CursorFollowerProps = {
  isHoveringImage?: boolean;
};

export function CursorFollower({
  isHoveringImage = false,
}: CursorFollowerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 300 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [cursorX, cursorY]);

  // Hide on touch devices
  if (typeof window !== "undefined" && "ontouchstart" in window) {
    return null;
  }

  return (
    <>
      {/* Main cursor dot */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[100] mix-blend-difference"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
        }}
      >
        <motion.div
          animate={{
            width: isHoveringImage ? 80 : 8,
            height: isHoveringImage ? 80 : 8,
            opacity: isVisible ? 1 : 0,
          }}
          className="-translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-cream"
          transition={{
            width: { duration: 0.3 },
            height: { duration: 0.3 },
            opacity: { duration: 0.2 },
          }}
        >
          {isHoveringImage ? (
            <motion.span
              animate={{ opacity: 1 }}
              className="font-medium text-background text-xs uppercase tracking-wider"
              initial={{ opacity: 0 }}
              transition={{ delay: 0.1 }}
            >
              View
            </motion.span>
          ) : null}
        </motion.div>
      </motion.div>

      {/* Outer ring */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[99]"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
        }}
      >
        <motion.div
          animate={{
            width: isHoveringImage ? 100 : 32,
            height: isHoveringImage ? 100 : 32,
            opacity: isVisible ? 1 : 0,
          }}
          className="-translate-x-1/2 -translate-y-1/2 rounded-full border border-cream/30"
          transition={{
            width: { duration: 0.4 },
            height: { duration: 0.4 },
            opacity: { duration: 0.2 },
          }}
        />
      </motion.div>
    </>
  );
}
