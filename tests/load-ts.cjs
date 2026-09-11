'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Module = require('node:module');
const root = path.resolve(__dirname, '..');
const ts = require(process.env.STUDIO_TYPESCRIPT_PATH || 'typescript');

function createLoader({ env = {}, fetch: fetcher = async () => { throw new Error('Unexpected network call in test'); } } = {}) {
  const cache = new Map();
  function load(relative) {
    const full = path.resolve(root, relative);
    if (cache.has(full)) return cache.get(full);
    const exports = {};
    cache.set(full, exports);
    const code = ts.transpileModule(fs.readFileSync(full, 'utf8'), { fileName: full.endsWith('.txt') ? 'baseline.ts' : full, reportDiagnostics: true, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    const requireFromFile = Module.createRequire(full);
    const resolveLocal = request => {
      let candidate = request.startsWith('@/') ? path.join(root, 'src', request.slice(2)) : path.resolve(path.dirname(full), request);
      for (const suffix of ['', '.ts', '.tsx', '.ts.txt', '.tsx.txt']) {
        const target = candidate + suffix;
        if (fs.existsSync(target) && fs.statSync(target).isFile()) return load(target);
      }
      throw new Error('Cannot resolve test import ' + request + ' from ' + full);
    };
    const req = request => {
      if (request === 'next/server') return { NextResponse: { json: (body, init) => Response.json(body, init) } };
      if (request.startsWith('.') || request.startsWith('@/')) return resolveLocal(request);
      return requireFromFile(request);
    };
    vm.runInNewContext(code, { exports, require: req, Buffer, TextDecoder, TextEncoder, Response, Request, URL,
      AbortController, setTimeout, clearTimeout, process: { env }, fetch: fetcher, console,
    }, { filename: full });
    return exports;
  }
  return { load, env };
}
module.exports = { createLoader, plain: value => JSON.parse(JSON.stringify(value)), root, ts };
