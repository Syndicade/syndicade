import { createContext, useContext, useState } from 'react';

var ThemeContext = createContext();

export function ThemeProvider({ children }) {
  var [isDark, setIsDark] = useState(true);

  var toggle = function() {
    setIsDark(function(prev) { return !prev; });
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}