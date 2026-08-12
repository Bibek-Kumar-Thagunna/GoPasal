const fs = require('fs');
const code = fs.readFileSync('app/checkout.tsx', 'utf8');

let stack = [];
let inString = false;
let stringChar = '';
let inComment = false;
let inBlockComment = false;

for (let i = 0; i < code.length; i++) {
  const c = code[i];
  const next = code[i + 1];

  if (!inString && !inComment && !inBlockComment) {
    if (c === '/' && next === '/') {
      inComment = true;
      i++;
      continue;
    }
    if (c === '/' && next === '*') {
      inBlockComment = true;
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      inString = true;
      stringChar = c;
      continue;
    }
    if (c === '{') {
      // Find line number
      const line = code.substring(0, i).split('\n').length;
      stack.push({ type: '{', line });
    }
    if (c === '}') {
      if (stack.length > 0 && stack[stack.length - 1].type === '{') {
        stack.pop();
      } else {
        const line = code.substring(0, i).split('\n').length;
        console.log('Unmatched } at line:', line);
      }
    }
  } else if (inString) {
    if (c === '\\') i++; // escape
    else if (c === stringChar) inString = false;
  } else if (inComment) {
    if (c === '\n') inComment = false;
  } else if (inBlockComment) {
    if (c === '*' && next === '/') {
      inBlockComment = false;
      i++;
    }
  }
}

console.log('Dangling {:', stack);
