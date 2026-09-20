import fs from 'node:fs/promises';
import path from 'node:path';
import { getLeanAST } from './lean-runner.js';
import { formatASTToMarkdown } from './formatter.js';

async function buildDocs() {
  const leanDir = './lean';
  const docsDir = './docs';

  await fs.mkdir(docsDir, { recursive: true });

  const leanFiles = [];
  for await (const entry of fs.glob(`${leanDir}/**/*.lean`)) {
    leanFiles.push(entry);
  }

  if (leanFiles.length === 0) {
    console.log(`⚠️ No se encontraron archivos .lean en ${leanDir}/`);
    return;
  }

  console.log(`📂 Procesando AST para ${leanFiles.length} archivo(s) .lean...`);

  for (const filePath of leanFiles) {
    console.log(`⚙️ Extrayendo AST de Lean 4 para: ${filePath}`);

    const [ast, sourceCode] = await Promise.all([
      getLeanAST(filePath),
      fs.readFile(filePath, 'utf-8')
    ]);

    const markdownOutput = formatASTToMarkdown(ast, filePath, sourceCode);

    const relativePath = path.relative(leanDir, filePath);
    const outputPath = path.join(docsDir, relativePath).replace(/\.lean$/, '.md');

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, markdownOutput, 'utf-8');

    console.log(`✅ Documento generado a partir del AST: ${outputPath}`);
  }
}

buildDocs().catch(console.error);