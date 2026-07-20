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
export default function ScrollReveal({
  children,
  delay = 0,
  duration = 0.7,
  yOffset = 40,
  className = "",
  id
}: ScrollRevealProps) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: duration,
        delay: delay,
        ease: [0.16, 1, 0.3, 1] // OutQuint easing curve for ultra-smooth feeling
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
