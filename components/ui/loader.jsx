import { Loader2, LoaderIcon } from "lucide-react";
import React from "react";

const Loader = () => {
  return (
    <div className=" absolute top-[50%] left-[50%]">
      <LoaderIcon className="h-8 w-8 animate-spin" />
    </div>
  );
};
export default Loader;
