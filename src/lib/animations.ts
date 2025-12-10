import type { Variants } from "framer-motion";

// Easing curves
export const easeOutExpo = [0.16, 1, 0.3, 1] as const;
export const easeInOutExpo = [0.87, 0, 0.13, 1] as const;

// Stagger container for children animations
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// Fade up animation for items
export const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 60,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: easeOutExpo,
    },
  },
};

// Fade in animation
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: easeOutExpo,
    },
  },
};

// Scale up animation
export const scaleUp: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: easeOutExpo,
    },
  },
};

// Slide from left
export const slideFromLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -100,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: easeOutExpo,
    },
  },
};

// Slide from right
export const slideFromRight: Variants = {
  hidden: {
    opacity: 0,
    x: 100,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: easeOutExpo,
    },
  },
};

// Text reveal animation (for split text)
export const textReveal: Variants = {
  hidden: {
    y: "100%",
  },
  visible: {
    y: 0,
    transition: {
      duration: 0.8,
      ease: easeOutExpo,
    },
  },
};

// Image reveal with clip path
export const imageReveal: Variants = {
  hidden: {
    clipPath: "inset(0 0 100% 0)",
  },
  visible: {
    clipPath: "inset(0 0 0% 0)",
    transition: {
      duration: 1,
      ease: easeInOutExpo,
    },
  },
};

// Parallax scroll values
export const parallaxValues = {
  slow: { start: 0, end: -50 },
  medium: { start: 0, end: -100 },
  fast: { start: 0, end: -200 },
};

// Page transition variants
export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: easeOutExpo,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: easeOutExpo,
    },
  },
};

// Hover scale for interactive elements
export const hoverScale = {
  scale: 1.05,
  transition: {
    duration: 0.3,
    ease: easeOutExpo,
  },
};

// Magnetic effect helper
export const magneticEffect = (x: number, y: number, strength = 0.3) => ({
  x: x * strength,
  y: y * strength,
  transition: {
    type: "spring",
    stiffness: 350,
    damping: 15,
  },
});
