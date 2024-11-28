import React, { useMemo } from "react";
import { motion } from "framer-motion";

const Cursor = ({ variant, name, color, x, y }) => {
  const cursorStyle = useMemo(
    () => ({
      zIndex: 99,
      position: "absolute",
      left: x,
      top: y,
      pointerEvents: "none",
    }),
    [x, y]
  );

  const nameStyle = useMemo(
    () => ({
      position: "absolute",
      left: "30%",
      top: "100%",
      backgroundColor: color,
      backgroundOpacity: "50%",
      color: "#fff",
      padding: "2px 5px",
      borderRadius: "3px",
      fontSize: "10px",
      whiteSpace: "nowrap",
    }),
    [color]
  );

  return (
    <motion.div
      style={cursorStyle}
      className="h-4 w-4 rounded-full absolute z-50"
      initial={{ scale: 1, opacity: 1 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
    >
      <svg
        width="24"
        height="36"
        viewBox="0 0 24 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
          fill={color}
        />
      </svg>
      <motion.div
        style={nameStyle}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
      >
        {name}
      </motion.div>
    </motion.div>
  );
};

export default React.memo(Cursor);
