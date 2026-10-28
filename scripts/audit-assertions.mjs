import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const base = process.argv[2] ?? 'origin/main';
const git = args => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
const beforeFiles = git(['ls-tree', '-r', '--name-only', base]).split('\n');
const afterFiles = git(['ls-files']).split('\n');
const relevant = file => /^tests\//.test(file) && /\.(?:ts|js|cjs)$/.test(file);
const built = new Set(['atlas-features', 'design-system', 'explorer-layout', 'explorer-home'].map(name => `tests/ui/pages/${name}.spec.ts`));
const suite = file => file.startsWith('tests/v2/') || built.has(file) ? 'built-explorer' : file.split('/')[1] === 'weather.test.cjs' ? 'unit' : file.split('/')[1];
function collect(files, read) {
  const totals = {}, assertions = new Map();
  for (const file of files.filter(relevant)) {
    const source = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true);
    function visit(node) {
      if (ts.isCallExpression(node) && node.expression.getText(source) === 'expect') {
        totals[suite(file)] = (totals[suite(file)] ?? 0) + 1;
        let expression = node;
        while (expression.parent && (ts.isPropertyAccessExpression(expression.parent) || ts.isCallExpression(expression.parent))) expression = expression.parent;
        const text = expression.getText(source).replace(/\s+/g, ' ').trim();
        const locations = assertions.get(text) ?? [];
        locations.push(`${file}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}`);
        assertions.set(text, locations);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  return { totals, assertions };
}
const before = collect(beforeFiles, file => git(['show', `${base}:${file}`]));
const after = collect(afterFiles, file => readFileSync(file, 'utf8'));
const removed = [...before.assertions].filter(([text, locations]) => locations.length > (after.assertions.get(text)?.length ?? 0));
const relocated = [...before.assertions]
  .filter(([text, locations]) => JSON.stringify(locations) !== JSON.stringify(after.assertions.get(text)))
  .map(([assertion, locations]) => ({ assertion, before: locations, after: after.assertions.get(assertion) ?? [] }));
const report = { base, before: before.totals, after: after.totals, removed: removed.map(([assertion, locations]) => ({ assertion, before: locations, after: after.assertions.get(assertion) ?? [] })), relocated };
console.log(JSON.stringify(report, null, 2));
if (removed.length || Object.entries(before.totals).some(([name, count]) => (after.totals[name] ?? 0) < count)) process.exitCode = 1;
