# Demonstrating debugging

The backend includes a small greeting service for demonstrating C# debugging. The visible page stays limited to Hello World.

## Live demonstration in VS Code

1. Open this folder in VS Code with the Microsoft C# extension enabled.
2. Open `src/HelloWorld/Services/GreetingService.cs`.
3. Set a breakpoint on `logger.LogDebug(...)`, after `message` is assigned.
4. Start **Debug ASP.NET greeting (port 5081)** from Run and Debug.
5. In a browser tab, visit `http://localhost:5081/api/greeting?name=%20%20%20`. The request waits while execution is paused.
6. In **Locals** or **Watch**, inspect:

   | Expression | Expected value |
   | --- | --- |
   | `name` | `"   "` |
   | `normalizedName` | `"World"` |
   | `message` | `"Hello World"` |

7. Press **F10** to step over the logging call, then **F5** to continue. The browser receives `{"message":"Hello World"}`.
8. Repeat with `http://localhost:5081/api/greeting?name=%20%20Ada%20%20`. The values become `"  Ada  "`, `"Ada"`, and `"Hello Ada"`.
9. Stop debugging with **Shift+F5**.

For a submission screenshot, capture VS Code while paused with the breakpoint and Locals/Watch visible. For the local-server requirement, capture the normal run command's `Now listening on` output alongside the Hello World page.

## Captured evidence

[artifacts/debug-session.txt](../artifacts/debug-session.txt) is output from an actual session with Samsung's [netcoredbg](https://github.com/Samsung/netcoredbg) debugger. It records both breakpoint stops, stack frames, evaluated C# expressions, stepping, and the HTTP responses after continuation.

The xUnit tests cover the same whitespace and padding behavior.

## Repeat the automated demonstration

The project-local tools used for the captured session are in `.tools/debugger/` and `.dotnet/` on this machine:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dotnet.ps1 build src/HelloWorld /m:1 /nr:false
node scripts/debug-check.cjs
```

Stop the normal server before building if its DLL is locked. The script starts its own Debug server on port **5082**, performs the inspection, then shuts it down. Success refreshes `artifacts/debug-session.txt`.

On a fresh checkout, this optional script needs Node.js, the .NET 10 SDK installed in `.dotnet/`, and the Windows x64 debugger from the official [netcoredbg releases](https://github.com/Samsung/netcoredbg/releases). Extract it to `.tools/debugger/netcoredbg/netcoredbg.exe`, or set `NETCOREDBG_PATH` to its location. These optional tools are ignored by Git. The normal VS Code workflow does not need Node.js or netcoredbg.

Development logs also report whether the default greeting was used and the name length, without recording the name itself.
