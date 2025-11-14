import React from "react";
import { BlockMath, InlineMath } from "react-katex";

// Heurística para detectar contenido LaTeX "puro" (sin mezclar texto largo)
function isLikelyMath(s?: string) {
  if (!s) return false;

  // Ya NO miramos '$' para evitar confundir precios
  return /\\frac|\\sqrt|\\sum|\\int|\\cdot|\\times|\\begin\{|\\left|\\right|\\phi|\\Phi|\\lambda|\\mu|\\sigma/.test(
    s
  );
}

/**
 * Render inline que:
 * 1) Si el texto tiene bloques \[ ... \], los separa en texto + InlineMath.
 * 2) Si TODO el texto parece una fórmula, lo manda a InlineMath.
 * 3) Si no, lo deja como texto normal.
 */
export function MathInline({ text }: { text: string }) {
  if (!text) return null;

  // 1) Caso mixto: texto + \[ ... \]
  const displayRegex = /\\\[(.*?)\\\]/gs; // captura \[ ... \]
  let match: RegExpExecArray | null;
  let lastIndex = 0;
  const parts: React.ReactNode[] = [];

  while ((match = displayRegex.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index);
    if (before) {
      parts.push(
        <span key={`t-${lastIndex}`} className="">
          {before}
        </span>
      );
    }

    const mathContent = match[1]; // interior de \[ ... \]
    parts.push(
      <InlineMath key={`m-${match.index}`} math={mathContent} />
    );

    lastIndex = displayRegex.lastIndex;
  }

  if (parts.length > 0) {
    const after = text.slice(lastIndex);
    if (after) {
      parts.push(
        <span key={`t-end`} className="">
          {after}
        </span>
      );
    }
    return <>{parts}</>;
  }

  // 2) Si NO hay \[...\] pero todo parece fórmula, úsalo como inline math
  if (isLikelyMath(text)) {
    // Si viniera entre $...$, limpiamos (por compatibilidad)
    const m = text.match(/^\$(.*)\$$/s);
    const math = m ? m[1] : text.replace(/\$/g, "");
    return <InlineMath math={math} />;
  }

  // 3) Texto normal
  return <>{text}</>;
}

/**
 * Bloque de matemáticas o texto monoespaciado.
 * Usado típicamente para mostrar "valor esperado" en retroalimentación.
 */
export function MathBlock({ text }: { text: string }) {
  if (!text) return null;

  if (isLikelyMath(text)) {
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
