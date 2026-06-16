import { createContext, useContext, useState } from 'react';

const NavContext = createContext({ hideNav: false, setHideNav: () => {} });

export function NavProvider({ children }) {
  const [hideNav, setHideNav] = useState(false);
  return (
    <NavContext.Provider value={{ hideNav, setHideNav }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNavVisibility() {
  return useContext(NavContext);
}