import path from 'node:path';

/**
 * Mapeo determinista de notación lógica a LaTeX
 */
function toLaTeX(expr) {
  if (!expr) return '';
  return expr
    .trim()
    .replace(/∀/g, '\\forall ')
    .replace(/∃/g, '\\exists ')
    .replace(/∧/g, '\\land ')
    .replace(/∨/g, '\\lor ')
    .replace(/→/g, '\\to ')
    .replace(/↔/g, '\\iff ')
    .replace(/¬/g, '\\neg ');
}

/**
 * Recorre recursivamente todo el árbol AST buscando todos los nodos que coincidan con un `kind`
 */
function findAllNodesByKind(node, targetKind, results = []) {
  if (!node || typeof node !== 'object') return results;
  if (node.kind === targetKind) {
    results.push(node);
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      findAllNodesByKind(child, targetKind, results);
    }
  }
  return results;
}

/**
 * Extrae todos los identificadores o átomos hojas dentro de un subárbol AST
 */
function extractLeafValues(node) {
  if (!node) return [];
  if (node.kind === 'ident' || node.kind === 'atom') {
    return [node.val];
  }
  let values = [];
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      values = values.concat(extractLeafValues(child));
    }
  }
  return values;
}

/**
 * Extrae dinámicamente la firma del teorema desde el AST:
 * - Nombre del teorema
 * - Diccionario de hipótesis (ej: { h: "P \\land Q" })
 * - Conclusión (ej: "P" o "Q")
 */
function extractSignatureFromAST(ast) {
  // 1. Nombre del teorema
  const declIdNodes = findAllNodesByKind(ast, 'Lean.Parser.Command.declId');
  const theoremName = declIdNodes.length > 0 
    ? extractLeafValues(declIdNodes[0])[0] 
    : 'Teorema';

  // 2. Hipótesis (binder)
  const hypotheses = {};
  const binderNodes = findAllNodesByKind(ast, 'Lean.Parser.Term.explicitBinder');
  
  for (const binder of binderNodes) {
    const leaves = extractLeafValues(binder);
    const colonIndex = leaves.indexOf(':');
    if (colonIndex > 1) {
      const varName = leaves[1]; // Nombre de la hipótesis (ej: "h")
      const typeExpr = leaves.slice(colonIndex + 1, leaves.length - 1).join(' ');
      hypotheses[varName] = typeExpr;
    }
  }

  // 3. Conclusión (typeSpec)
  const typeSpecNodes = findAllNodesByKind(ast, 'Lean.Parser.Term.typeSpec');
  let conclusion = 'P';
  if (typeSpecNodes.length > 0) {
    const leaves = extractLeafValues(typeSpecNodes[0]);
    if (leaves.length > 1) {
      conclusion = leaves.slice(1).join(' ');
    }
  }

  return { theoremName, hypotheses, conclusion };
}

/**
 * Traduce recursivamente cada paso de táctica encontrado en el AST
 */
function translateTacticNode(tacticNode, hypotheses, conclusion) {
  const leaves = extractLeafValues(tacticNode);
  const term = leaves.join('');

  // Identificación de proyecciones del lado IZQUIERDO: h.1, h.left, And.left
  if (term.includes('.1') || term.includes('.left') || term.includes('And.left')) {
    const hypName = term.split('.')[0].replace('exact', '');
    const rawHyp = hypotheses[hypName] || 'las premisas';
    return `Como se cumple $${toLaTeX(rawHyp)}$, en particular se cumple $${toLaTeX(conclusion)}$.`;
  }

  // Identificación de proyecciones del lado DERECHO: h.2, h.right, And.right
  if (term.includes('.2') || term.includes('.right') || term.includes('And.right')) {
    const hypName = term.split('.')[0].replace('exact', '');
    const rawHyp = hypotheses[hypName] || 'las premisas';
    return `Como se cumple $${toLaTeX(rawHyp)}$, en particular se cumple $${toLaTeX(conclusion)}$.`;
  }

  // Caso genérico para la táctica exact
  const cleanTerm = term.replace(/^exact/, '');
  return `Por la premisa $${toLaTeX(cleanTerm)}$, queda demostrado que $${toLaTeX(conclusion)}$.`;
}

/**
 * Formatea el AST completo a un documento Markdown + LaTeX
 */
export function formatASTToMarkdown(ast, filePath, sourceCode) {
  const { theoremName, hypotheses, conclusion } = extractSignatureFromAST(ast);

  // Buscar TODOS los nodos de tácticas exactas anidados en el AST
  const exactTacticNodes = findAllNodesByKind(ast, 'Lean.Parser.Tactic.exact');

  let proofNarrative = '';
  if (exactTacticNodes.length > 0) {
    proofNarrative = exactTacticNodes
      .map(node => translateTacticNode(node, hypotheses, conclusion))
      .join('\n\n');
  } else {
    proofNarrative = `Se concluye la demostración de $${toLaTeX(conclusion)}$.`;
  }

  const hypList = Object.values(hypotheses).map(h => `$${toLaTeX(h)}$`).join(', ');
  const statementText = hypList
    ? `Dado ${hypList}, se concluye $${toLaTeX(conclusion)}$.`
    : `Se concluye $${toLaTeX(conclusion)}$.`;

  let md = `## Teorema \`${theoremName}\`\n\n`;
  md += `${statementText}\n\n`;
  md += `### Demostración:\n\n`;
  md += `${proofNarrative}\n\n`;
  md += `$$\\blacksquare$$\n`;

  return md;
}