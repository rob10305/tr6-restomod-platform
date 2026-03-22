import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSelectedCar } from "@/context/CarContext";
import triumphTr6Image from "../assets/images/triumph-tr6.png";
import triumphTr4Image from "../assets/images/triumph-tr4.png";
import fordEscortMk1Image from "../assets/images/ford-escort-mk1.png";
import fordEscortMk2Image from "../assets/images/ford-escort-mk2.png";
import fordMustangImage from "@assets/1970mustang_1769737333502.png";
import fordBroncoImage from "@assets/Bronco1975_1769737549360.png";
import fordF100Image from "@assets/F1001960_1769737884394.png";

interface CarModel {
  id: string;
  name: string;
  years: string;
  image: string | null;
  available: boolean;
}

interface CarMake {
  id: string;
  name: string;
  models: CarModel[];
}

const carMakes: CarMake[] = [
  {
    id: "ford",
    name: "Ford",
    models: [
      { id: "mustang", name: "Mustang", years: "1964-1973", image: fordMustangImage, available: false },
      { id: "bronco", name: "Bronco", years: "1966-1977", image: fordBroncoImage, available: false },
      { id: "f100", name: "F-100", years: "1953-1983", image: fordF100Image, available: false },
      { id: "escort-mk1", name: "Escort Mk1", years: "1968-1975", image: fordEscortMk1Image, available: false },
      { id: "escort-mk2", name: "Escort Mk2", years: "1975-1980", image: fordEscortMk2Image, available: false },
    ]
  },
  {
    id: "chevrolet",
    name: "Chevrolet",
    models: [
      { id: "camaro", name: "Camaro", years: "1967-1969", image: null, available: false },
      { id: "corvette", name: "Corvette", years: "1953-1982", image: null, available: false },
      { id: "chevelle", name: "Chevelle", years: "1964-1977", image: null, available: false },
    ]
  },
  {
    id: "triumph",
    name: "Triumph",
    models: [
      { id: "tr6", name: "TR6", years: "1969-1976", image: triumphTr6Image, available: true },
      { id: "tr4", name: "TR4", years: "1961-1965", image: triumphTr4Image, available: false },
      { id: "tr4a", name: "TR4A", years: "1965-1967", image: null, available: false },
      { id: "tr250", name: "TR250", years: "1967-1968", image: null, available: false },
      { id: "spitfire", name: "Spitfire", years: "1962-1980", image: null, available: false },
    ]
  },
  {
    id: "mg",
    name: "MG",
    models: [
      { id: "mgb", name: "MGB", years: "1962-1980", image: null, available: false },
      { id: "mga", name: "MGA", years: "1955-1962", image: null, available: false },
      { id: "midget", name: "Midget", years: "1961-1979", image: null, available: false },
    ]
  }
];

interface MakeModelSelectorProps {
  onSelect?: (make: string, model: string) => void;
  selectedMake?: string;
  selectedModel?: string;
}

export function MakeModelSelector({ onSelect, selectedMake = "triumph", selectedModel = "tr6" }: MakeModelSelectorProps) {
  const [activeMake, setActiveMake] = useState(selectedMake);
  const [activeModel, setActiveModel] = useState(selectedModel);
  const { setSelectedCar } = useSelectedCar();

  const updateSelectedCar = (makeId: string, modelId: string) => {
    const make = carMakes.find(m => m.id === makeId);
    const model = make?.models.find(m => m.id === modelId);
    if (make && model) {
      setSelectedCar({
        makeId: make.id,
        makeName: make.name,
        modelId: model.id,
        modelName: model.name,
        years: model.years,
        image: model.image,
      });
    }
  };

  useEffect(() => {
    updateSelectedCar(activeMake, activeModel);
  }, []);

  const handleMakeChange = (makeId: string) => {
    setActiveMake(makeId);
    const make = carMakes.find(m => m.id === makeId);
    if (make && make.models.length > 0) {
      const firstAvailable = make.models.find(m => m.available) || make.models[0];
      setActiveModel(firstAvailable.id);
      updateSelectedCar(makeId, firstAvailable.id);
      onSelect?.(makeId, firstAvailable.id);
    }
  };

  const handleModelSelect = (modelId: string) => {
    const make = carMakes.find(m => m.id === activeMake);
    const model = make?.models.find(m => m.id === modelId);
    if (model?.available) {
      setActiveModel(modelId);
      updateSelectedCar(activeMake, modelId);
      onSelect?.(activeMake, modelId);
    }
  };

  const currentMake = carMakes.find(m => m.id === activeMake);

  return (
    <div className="w-full bg-background border-b border-border" data-testid="make-model-selector">
      <Tabs value={activeMake} onValueChange={handleMakeChange} className="w-full">
        <div className="container px-4">
          <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 gap-0">
            {carMakes.map((make) => (
              <TabsTrigger
                key={make.id}
                value={make.id}
                className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground transition-colors"
                data-testid={`tab-make-${make.id}`}
              >
                {make.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {carMakes.map((make) => (
          <TabsContent key={make.id} value={make.id} className="mt-0">
            <div className="container px-4 py-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {make.models.map((model) => (
                  <Card
                    key={model.id}
                    onClick={() => handleModelSelect(model.id)}
                    className={cn(
                      "relative cursor-pointer transition-all duration-200 border-2 bg-card",
                      activeModel === model.id 
                        ? "border-primary ring-2 ring-primary/30" 
                        : "border-border"
                    )}
                    data-testid={`card-model-${model.id}`}
                  >
                    <div className="aspect-[16/10] relative bg-black flex items-center justify-center" data-testid={`image-model-${model.id}`}>
                      {model.image ? (
                        <img 
                          src={model.image} 
                          alt={model.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-muted-foreground text-xs font-medium" data-testid={`status-coming-soon-${model.id}`}>Coming Soon</div>
                      )}
                    </div>
                    <div className="p-3 text-center">
                      <h3 className="font-bold text-foreground text-sm" data-testid={`text-model-name-${model.id}`}>{model.name}</h3>
                      <p className="text-muted-foreground text-xs" data-testid={`text-model-years-${model.id}`}>{model.years}</p>
                      {!model.available && (
                        <span className="inline-block mt-1 text-[10px] text-muted-foreground uppercase tracking-wide" data-testid={`status-unavailable-${model.id}`}>Coming Soon</span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
