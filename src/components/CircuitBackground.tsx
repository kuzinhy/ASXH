import React from "react";

function CircuitBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-60">
      {/* Subtle tech background gradients */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-sky-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />
      
      {/* SVG Tech Grid & Motifs */}
      <svg className="w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <defs>
          <pattern id="tech-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(14, 165, 233, 0.12)" strokeWidth="0.8" />
            <circle cx="60" cy="0" r="1.5" fill="rgba(14, 165, 233, 0.25)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tech-grid)" />
      </svg>
    </div>
  );
}

export default React.memo(CircuitBackground);

