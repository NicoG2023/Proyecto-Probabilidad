// src/constants/practice/types.ts

export type ParamsState = Record<string, any>;

export type SliderConfig = {
  min: number;
  max: number;
  step: number;
  asPercent?: boolean; // mostrar 0.25 como "25 %"
  label?: string;
};

export type ParamsValidator = (
  templateId: number,
  params: ParamsState
) => string | null;
