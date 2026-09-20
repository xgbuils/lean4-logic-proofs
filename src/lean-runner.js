import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';

const execFileAsync = promisify(execFile);

// Definición inline de ExportAST para evitar problemas de imports en Lean
const LEAN_EXPORT_HEADER = `
import Lean

open Lean Elab Command Syntax

partial def syntaxToJSON : Syntax → Json
  | Syntax.node _ kind args =>
    Json.mkObj [
      ("kind", toString kind),
      ("children", Json.arr (args.map syntaxToJSON))
    ]
  | Syntax.atom _ val =>
    Json.mkObj [
      ("kind", "atom"),
      ("val", val)
    ]
  | Syntax.ident _ _ val _ =>
    Json.mkObj [
      ("kind", "ident"),
      ("val", toString val)
    ]
  | Syntax.missing =>
    Json.mkObj [("kind", "missing")]

elab "#export_ast " c:command : command => do
  let jsonAST := syntaxToJSON c
  IO.println jsonAST.compress
`;

export async function getLeanAST(filePath) {
  const sourceCode = await fs.readFile(filePath, 'utf-8');

  // Inyectamos las funciones directamente en el archivo temporal
  const tempScriptContent = `${LEAN_EXPORT_HEADER}\n#export_ast ${sourceCode.trim()}\n`;
  const tempFilePath = path.join(path.dirname(filePath), `_temp_${path.basename(filePath)}`);

  try {
    await fs.writeFile(tempFilePath, tempScriptContent, 'utf-8');

    // Invocamos 'lean' directamente sin '--run'
    const { stdout } = await execFileAsync('lean', [tempFilePath]);
    
    const jsonLine = stdout.trim().split('\n').find(line => line.startsWith('{'));
    if (!jsonLine) {
      throw new Error('No se pudo extraer la salida JSON del AST emitido por Lean 4.');
    }
    return JSON.parse(jsonLine);
  } finally {
    await fs.rm(tempFilePath, { force: true });
  }
}