// src/components/MathExpressionInput.tsx
import { useEffect, useRef } from "react";
import type { MathfieldElement } from "mathlive";
import "mathlive"; // registra <math-field>

type Props = {
  value: string;
  onChange: (latex: string) => void;
  placeholder?: string;
};

export function MathExpressionInput({ value, onChange, placeholder }: Props) {
  const fieldRef = useRef<MathfieldElement | null>(null);

  // Mantener el valor controlado desde React
  useEffect(() => {
    if (!fieldRef.current) return;
    const current = fieldRef.current.getValue("latex-unstyled");
    if (current !== value) {
      fieldRef.current.setValue(value ?? "", { format: "latex" });
    }
  }, [value]);

  const handleInput = () => {
    if (!fieldRef.current) return;
    // 🔹 LaTeX “limpio”, sin estilos
    const latex = fieldRef.current.getValue("latex-unstyled");
    onChange(latex);
  };

  return (
    <div className="w-full">
      <math-field
        ref={fieldRef as any}
        className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-400"
        onInput={handleInput}
        placeholder={placeholder ?? "Escribe tu expresión aquí"}
      />
      <p className="mt-1 text-[10px] text-gray-500">
        Puedes usar símbolos como{" "}
        <code>{String.raw`\binom{n}{k}`}</code>, <code>^</code>, <code>!</code>,
        etc.
      </p>
    </div>
  );
}
