// src/types/mathlive.d.ts
import type React from "react";

interface MathFieldProps extends React.HTMLAttributes<HTMLElement> {
  placeholder?: string;
  readOnly?: boolean;
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "math-field": React.DetailedHTMLProps<MathFieldProps, HTMLElement>;
    }
  }
}
