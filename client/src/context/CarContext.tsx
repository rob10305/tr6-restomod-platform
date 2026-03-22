import { createContext, useContext, useState, useEffect } from "react";

interface SelectedCar {
  makeId: string;
  makeName: string;
  modelId: string;
  modelName: string;
  years: string;
  image: string | null;
}

interface CarContextType {
  selectedCar: SelectedCar | null;
  setSelectedCar: (car: SelectedCar | null) => void;
}

const CarContext = createContext<CarContextType | undefined>(undefined);

export function CarProvider({ children }: { children: React.ReactNode }) {
  const [selectedCar, setSelectedCar] = useState<SelectedCar | null>(() => {
    const stored = localStorage.getItem("selectedCar");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (selectedCar) {
      localStorage.setItem("selectedCar", JSON.stringify(selectedCar));
    }
  }, [selectedCar]);

  return (
    <CarContext.Provider value={{ selectedCar, setSelectedCar }}>
      {children}
    </CarContext.Provider>
  );
}

export function useSelectedCar() {
  const context = useContext(CarContext);
  if (context === undefined) {
    throw new Error("useSelectedCar must be used within a CarProvider");
  }
  return context;
}
