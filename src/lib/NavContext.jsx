import { createContext, useContext, useState, useCallback } from 'react';

const NavContext = createContext({ hideNav: false, setHideNav: () => {}, scrollToTopSignal: 0, triggerScrollToTop: () => {} });

export function NavProvider({ children }) {
  const [hideNav, setHideNav] = useState(false);
  const [scrollToTopSignal, setScrollToTopSignal] = useState(0);
  const triggerScrollToTop = useCallback(() => setScrollToTopSignal(s => s + 1), []);
  return (
    <NavContext.Provider value={{ hideNav, setHideNav, scrollToTopSignal, triggerScrollToTop }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNavVisibility() {
  return useContext(NavContext);
}