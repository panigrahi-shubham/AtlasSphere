import { appendFile, readFile, readdir } from 'node:fs/promises';
import { XMLParser } from 'fast-xml-parser';

const directory = 'test-results/junit';
const parser = new XMLParser({ ignoreAttributes: false });
const names = await readdir(directory).catch(() => []);
const rows = [];
for (const name of names.filter(name => name.endsWith('.xml')).sort()) {
  const document = parser.parse(await readFile(`${directory}/${name}`, 'utf8'));
  const root = document.testsuites ?? document.testsuite;
  const total = Number(root?.['@_tests'] ?? 0);
  const failed = Number(root?.['@_failures'] ?? 0) + Number(root?.['@_errors'] ?? 0);
  const skipped = Number(root?.['@_skipped'] ?? 0);
  rows.push(`| ${name.slice(0, -4)} | ${total - failed - skipped} | ${failed} | ${skipped} |`);
}
const summary = ['## Test results', '', '| Suite | Passed | Failed | Skipped |', '| --- | ---: | ---: | ---: |', ...rows, ''].join('\n');
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
else console.log(summary);
