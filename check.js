const fs = require('fs');
const registryStr = fs.readFileSync('apps/web/lib/tools-registry.ts', 'utf-8');
const pageStr = fs.readFileSync('apps/web/app/[category]/[tool]/page.tsx', 'utf-8');

const liveMatches = [...registryStr.matchAll(/slug:\s*"([^"]+)",[^}]+status:\s*"live"/g)].map(m => m[1]);
const componentsStr = pageStr.substring(pageStr.indexOf('const TOOL_COMPONENTS'));
const compMatches = [...componentsStr.matchAll(/"([^"]+)":\s*[A-Z][a-zA-Z0-9_]+/g)].map(m => m[1]);

const missing = liveMatches.filter(slug => !compMatches.includes(slug));

console.log("Live tools listed in registry:", liveMatches.length);
console.log("Tools instantiated in page.tsx:", compMatches.length);
console.log("Missing live tools from page.tsx:", missing);
