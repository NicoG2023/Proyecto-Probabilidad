// src/utils/MathText.tsx
import { BlockMath, InlineMath } from "react-katex";

// Heurística muy simple para detectar contenido LaTeX
function isLikelyMath(s?: string) {
  if (!s) return false;
  return (
    /\$\$[\s\S]*\$\$/.test(s) ||       // $$...$$
    /\$[^$]+\$/.test(s) ||             // $...$
    /\\frac|\\sqrt|\\sum|\\int|\\cdot|\\times|\\begin{/.test(s)
  );
}

export function MathInline({ text }: { text: string }) {
  if (!text) return null;

  if (isLikelyMath(text)) {
    // Si viene $...$ inline, extrae el interior
    const m = text.match(/^\$(.*)\$$/s);
    const math = m ? m[1] : text.replace(/\$/g, "");
    return <InlineMath math={math} />;
  }
  return <>{text}</>;
}

export function MathBlock({ text }: { text: string }) {
  if (!text) return null;

  if (isLikelyMath(text)) {
    // Si viene $$...$$ block, extrae el interior
    const m = text.match(/^\$\$(.*)\$\$$/s);
    const math = m ? m[1] : text.replace(/\$\$/g, "");
    return (
      <div className="mt-1">
        <BlockMath math={math} />
      </div>
    );
  }
  // Si no es LaTeX, muéstralo como texto normal/monoespaciado
  return <span className="font-mono">{text}</span>;
}
