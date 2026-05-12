import React, { createContext, useContext, useState, useEffect } from 'react';

export type TempUnit = 'C' | 'F' | 'K';

interface UnitContextType {
  unit: TempUnit;
  setUnit: (unit: TempUnit) => void;
  convertTemp: (celsius: number) => string;
}

const UnitContext = createContext<UnitContextType | undefined>(undefined);

export const UnitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unit, setUnitState] = useState<TempUnit>(() => {
    const saved = localStorage.getItem('tempUnit');
    return (saved as TempUnit) || 'C';
  });

  const setUnit = (newUnit: TempUnit) => {
    setUnitState(newUnit);
    localStorage.setItem('tempUnit', newUnit);
  };

  const convertTemp = (celsius: number): string => {
    switch (unit) {
      case 'F':
        return `${(celsius * 9/5 + 32).toFixed(1)}°F`;
      case 'K':
        return `${(celsius + 273.15).toFixed(1)}K`;
      default:
        return `${celsius.toFixed(1)}°C`;
    }
  };

  return (
    <UnitContext.Provider value={{ unit, setUnit, convertTemp }}>
      {children}
    </UnitContext.Provider>
  );
};

export const useUnit = () => {
  const context = useContext(UnitContext);
  if (!context) {
    throw new Error('useUnit must be used within a UnitProvider');
  }
  return context;
};
