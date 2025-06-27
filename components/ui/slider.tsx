import * as React from "react";

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onValueChange: (value: number) => void;
}

export const Slider: React.FC<SliderProps> = ({ min = 0, max = 100, step = 1, value, onValueChange, ...props }) => {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onValueChange(Number(e.target.value))}
      className="w-32 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-400"
      {...props}
    />
  );
};
