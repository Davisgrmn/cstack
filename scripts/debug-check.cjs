// Optional real breakpoint verification using Samsung netcoredbg's Debug Adapter Protocol.
const { spawn } = require('node:child_process');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const debuggerPath = process.env.NETCOREDBG_PATH || path.join(root, '.tools/debugger/netcoredbg/netcoredbg.exe');
const child = spawn(debuggerPath, ['--interpreter=vscode'], {
  cwd: root, windowsHide: true,
  env: { ...process.env, DOTNET_ROOT: path.join(root, '.dotnet') }
});
const events = new EventEmitter();
const pending = new Map();
const transcript = [`Real C# breakpoint session: ${new Date().toISOString()}`, 'Debugger: Samsung netcoredbg (DAP)'];
let sequence = 0;
let buffer = Buffer.alloc(0);
child.stdout.on('data', data => {
  buffer = Buffer.concat([buffer, data]);
  while (true) {
    const boundary = buffer.indexOf('\r\n\r\n');
    if (boundary < 0) break;
    const length = Number(/Content-Length:\s*(\d+)/i.exec(buffer.subarray(0, boundary).toString())[1]);
    if (buffer.length < boundary + 4 + length) break;
    const message = JSON.parse(buffer.subarray(boundary + 4, boundary + 4 + length).toString());
    buffer = buffer.subarray(boundary + 4 + length);
    if (message.type === 'response') {
      const callback = pending.get(message.request_seq);
      if (callback) { pending.delete(message.request_seq); callback(message); }
    } else if (message.type === 'event') {
      events.emit(message.event, message.body);
    }
  }
});
child.stderr.on('data', data => process.stderr.write(data));
child.on('error', error => { console.error(error); process.exitCode = 1; });

function request(command, args = {}) {
  return new Promise((resolve, reject) => {
    const seq = ++sequence;
    const timer = setTimeout(() => { pending.delete(seq); reject(new Error(`Timed out: ${command}`)); }, 30000);
    pending.set(seq, response => {
      clearTimeout(timer);
      response.success ? resolve(response.body) : reject(new Error(`${command}: ${response.message}`));
    });
    const json = JSON.stringify({ seq, type: 'request', command, arguments: args });
    child.stdin.write(`Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}`);
  });
}

function event(name) {
  return new Promise((resolve, reject) => {
    const handler = body => { clearTimeout(timer); resolve(body); };
    const timer = setTimeout(() => { events.off(name, handler); reject(new Error(`Timed out waiting for ${name}`)); }, 30000);
    events.once(name, handler);
  });
}

(async () => {
  try {
    const initialized = event('initialized');
    await request('initialize', { adapterID: 'coreclr', clientID: 'hello-world-check', linesStartAt1: true, columnsStartAt1: true, pathFormat: 'path' });
    const launch = request('launch', {
      name: 'HelloWorld debug verification', type: 'coreclr', request: 'launch',
      program: path.join(root, '.dotnet/dotnet.exe'),
      args: [path.join(root, 'src/HelloWorld/bin/Debug/net10.0/HelloWorld.dll')],
      cwd: path.join(root, 'src/HelloWorld'), stopAtEntry: false, justMyCode: true,
      env: { DOTNET_ROOT: path.join(root, '.dotnet'), ASPNETCORE_ENVIRONMENT: 'Development', ASPNETCORE_URLS: 'http://localhost:5082' }
    });
    // Some adapters acknowledge launch only after configurationDone.
    launch.catch(() => {});
    await initialized;
    const source = path.join(root, 'src/HelloWorld/Services/GreetingService.cs');
    const line = fs.readFileSync(source, 'utf8').split(/\r?\n/).findIndex(s => s.includes('logger.LogDebug(')) + 1;
    await request('setBreakpoints', { source: { path: source }, breakpoints: [{ line }] });
    await request('configurationDone');
    await launch;
    let ready = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      try {
        const response = await fetch('http://localhost:5082/', { signal: AbortSignal.timeout(2000) });
        if (response.ok) { ready = true; break; }
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    assert.ok(ready, 'The debug server must start');
    transcript.push('Debug server: http://localhost:5082', `Breakpoint: src/HelloWorld/Services/GreetingService.cs:${line}`);

    for (const [input, expectedName, expectedMessage] of [['   ', 'World', 'Hello World'], ['  Ada  ', 'Ada', 'Hello Ada']]) {
      const stopped = event('stopped');
      const responsePromise = fetch(`http://localhost:5082/api/greeting?name=${encodeURIComponent(input)}`, { signal: AbortSignal.timeout(60000) });
      responsePromise.catch(() => {});
      const stop = await stopped;
      assert.equal(stop.reason, 'breakpoint');
      const stack = await request('stackTrace', { threadId: stop.threadId });
      const frame = stack.stackFrames[0];
      transcript.push('', `Request name: ${JSON.stringify(input)}`, `Stopped: ${stop.reason}`, `Frame: ${frame.name} at line ${frame.line}`);
      for (const [expression, expected] of [['name', input], ['normalizedName', expectedName], ['message', expectedMessage]]) {
        const value = await request('evaluate', { expression, frameId: frame.id, context: 'watch' });
        transcript.push(`${expression} = ${value.result}`);
        assert.equal(value.result, JSON.stringify(expected));
      }
      const stepped = event('stopped');
      await request('next', { threadId: stop.threadId });
      const step = await stepped;
      transcript.push(`Stepped over logging: ${step.reason}`);
      await request('continue', { threadId: step.threadId });
      const response = await responsePromise;
      const body = await response.json();
      assert.equal(body.message, expectedMessage);
      transcript.push(`Continued: HTTP ${response.status} ${JSON.stringify(body)}`);
    }
    transcript.push('', 'PASS: Both real breakpoints, inspected variables, stepping, and HTTP responses verified.');
    fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
    fs.writeFileSync(path.join(root, 'artifacts/debug-session.txt'), transcript.join('\n') + '\n');
    console.log(transcript.join('\n'));
  } finally {
    try { await request('disconnect', { terminateDebuggee: true }); } finally { child.kill(); }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
