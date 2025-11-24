import { createContext, useContext, useState, ReactNode } from 'react';

type Mode = 'topper' | 'pass';

interface ModeContextType {
  mode: Mode;
  setMode: (mode: Mode) => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export const ModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<Mode>('topper');

  return (
    <ModeContext.Provider value={{ mode, setMode }}>
      <div className={`mode-${mode}`}>
        {children}
      </div>
    </ModeContext.Provider>
  );
};

export const useMode = () => {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within ModeProvider');
  }
  return context;
};
