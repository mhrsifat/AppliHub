import { useContext } from "react";
import DarkModeContext from "../context/DarkModeContext";

const useDarkMode = () => useContext(DarkModeContext);

export default useDarkMode;
