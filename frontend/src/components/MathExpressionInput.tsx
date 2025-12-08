// src/components/MathExpressionInput.tsx
import { useEffect, useRef } from "react";
import type { MathfieldElement } from "mathlive";
import "mathlive"; // registra <math-field>

type Props = {
  value: string;
  onChange: (latex: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function MathExpressionInput({
  value,
  onChange,
  placeholder,
  disabled,
}: Props) {
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
    if (!fieldRef.current || disabled) return;

    let latex = fieldRef.current.getValue("latex-unstyled");

    // Expandir fracciones tipo \frac14 → \frac{1}{4}
    latex = latex.replace(/\\frac\s*([0-9]+)\s*([0-9]+)/g, "\\frac{$1}{$2}");

    // Normalizar raíces numéricas: \sqrt4 → \sqrt{4}
    latex = latex.replace(
      /\\sqrt\s*([0-9]+(?:\.[0-9]+)?)/g,
      "\\sqrt{$1}"
    );

    onChange(latex);
  };

  return (
    <div className="w-full">
      <math-field
        ref={fieldRef as any}
        className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-400"
        onInput={handleInput}
        placeholder={placeholder ?? "Escribe tu expresión aquí"}
        readOnly={disabled}
      />
      <p className="mt-1 text-[10px] text-gray-500">
        Puedes usar símbolos como{" "}
        <code>{String.raw`\binom{n}{k}`}</code>, <code>^</code>, <code>!</code>,
        etc.
      </p>
    </div>
  );
}
