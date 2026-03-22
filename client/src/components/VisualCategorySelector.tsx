import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Gauge, CircleDot, Zap, Anchor, Wind, Layers, Settings, Disc } from "lucide-react";
import { Card } from "@/components/ui/card";

const categories = [
  { id: "1", name: "Engine", icon: Settings, color: "text-primary", desc: "Blocks, pistons, heads" },
  { id: "2", name: "Suspension", icon: Anchor, color: "text-blue-400", desc: "Shocks, springs, bushings" },
  { id: "5", name: "Electrical", icon: Zap, color: "text-blue-300", desc: "Ignition, lighting, wiring" },
  { id: "3", name: "Interior", icon: Layers, color: "text-muted-foreground", desc: "Seats, dash, trim" },
  { id: "6", name: "Brakes", icon: Disc, color: "text-blue-500", desc: "Calipers, rotors, pads" },
  { id: "7", name: "Wheels & Tires", icon: CircleDot, color: "text-foreground", desc: "Rims, tires, lugs" },
  { id: "8", name: "Exhaust", icon: Wind, color: "text-muted-foreground", desc: "Headers, mufflers, pipes" },
  { id: "4", name: "Instruments", icon: Gauge, color: "text-accent", desc: "Gauges, switches" },
];

export function VisualCategorySelector() {
  const [, setLocation] = useLocation();

  const handleCategoryClick = (categoryId: string) => {
    window.scrollTo(0, 0);
    setLocation(`/category/${categoryId}`);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {categories.map((cat, index) => (
        <motion.div
          key={cat.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <div onClick={() => handleCategoryClick(cat.id)} className="cursor-pointer">
            <Card className="group h-full p-6 cursor-pointer bg-card border-border hover:border-primary/50 transition-all hover:bg-muted/80">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={`p-3 rounded-full bg-background border border-border group-hover:border-primary/30 transition-colors ${cat.color}`}>
                  <cat.icon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {cat.desc}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
