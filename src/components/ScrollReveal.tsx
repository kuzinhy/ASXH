import React from "react";
import { motion } from "motion/react";

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  className?: string;
  id?: string;
}

/**
 * ScrollReveal component to trigger fade-in and upward slide animations 
 * as the user scrolls down the page, matching professional corporate sites.
 */
function ScrollReveal({
  children,
  delay = 0,
  duration = 0.5,
  yOffset = 25,
  className = "",
  id
}: ScrollRevealProps) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.01 }}
      transition={{
        duration: duration,
        delay: delay,
        ease: [0.16, 1, 0.3, 1] // OutQuint easing curve for ultra-smooth feeling
      }}
      className={`transform-gpu ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default React.memo(ScrollReveal);
