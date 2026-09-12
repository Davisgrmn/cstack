# Hello World

A barebones C# / ASP.NET Core app. The page shows only **Hello World**, centered horizontally and vertically in black, 32px Arial on white. It uses Blazor WebAssembly, Razor components, and MudBlazor.

## Run locally

From this folder in PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dotnet.ps1 run --project src/HelloWorld --launch-profile http
```

Open **http://localhost:5080**. If the demo is already running, open that address directly. Otherwise, keep the terminal open; press **Ctrl+C** to stop it.

The helper uses the .NET 10 SDK installed in this workspace's `.dotnet` folder, with a project-local NuGet cache. The execution-policy override applies only to that PowerShell process.

On another machine, install the [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0), then run:

```powershell
dotnet run --project src/HelloWorld --launch-profile http
```

The first build requires internet access for NuGet packages. No database, credentials, or Node.js installation is needed for the app or xUnit tests.

## Requirements and evidence

| Requirement | Implementation / evidence |
| --- | --- |
| Local server | ASP.NET Core / Kestrel at port 5080; [startup output](artifacts/server-startup.txt) |
| Hello World route | `/` in [Home.razor](src/HelloWorld.Client/Pages/Home.razor); [desktop screenshot](artifacts/desktop.png), [mobile screenshot](artifacts/mobile.png) |
| Templating / rendering | Razor components prerendered by ASP.NET, then loaded using explicit `InteractiveWebAssembly` rendering |
| UI framework | MudBlazor `MudText` renders the heading; [CSS](src/HelloWorld/wwwroot/app.css) sets its simple appearance |
| Automated test | **12 passing xUnit tests**; [test source](tests/HelloWorld.Tests/GreetingTests.cs), [TRX results](artifacts/tests.trx) |
| Debugging | Real breakpoints, variable inspection, stepping, and continuation; [captured session](artifacts/debug-session.txt), [walkthrough](docs/DEBUGGING.md) |

The hosting configuration follows the [Blazor Web App approach](https://learn.microsoft.com/en-us/aspnet/core/blazor/tooling?view=aspnetcore-10.0), with MudBlazor services and assets registered using its [installation guidance](https://mudblazor.com/getting-started/installation).

## Tests

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dotnet.ps1 test HelloWorld.slnx /m:1 /nr:false --logger "trx;LogFileName=tests.trx" --results-directory artifacts
```

With a system SDK: `dotnet test HelloWorld.slnx`. Stop the running app before rebuilding if Windows reports locked DLLs.

Tests cover the real HTML route (including the heading, MudBlazor markup, and WebAssembly bootstrap), greeting normalization, and API validation. The API is retained as a small backend debugging example; the page itself has no input fields, buttons, or other visible content.

## Debugging

Open the folder in VS Code with the Microsoft **C#** extension. Put a breakpoint on `logger.LogDebug(...)` in [GreetingService.cs](src/HelloWorld/Services/GreetingService.cs), then start **Debug ASP.NET greeting (port 5081)** with F5.

In a browser tab, visit `http://localhost:5081/api/greeting?name=%20Ada%20`. Inspect `name`, `normalizedName`, and `message`, press F10 to step, then F5 to continue. See [DEBUGGING.md](docs/DEBUGGING.md) for the whitespace case and captured evidence.

The VS Code configuration points `DOTNET_ROOT` at the workspace SDK. If using only a system SDK on another machine, remove that entry from `.vscode/launch.json`.

## Optional browser verification

[Browser results](artifacts/browser-check.txt) confirm WebAssembly starts and that desktop and mobile show only the centered, black greeting.

To refresh screenshots, install Node.js and Microsoft Edge, start the app, then run:

```powershell
npm.cmd install --prefix .tools/browser --no-save --package-lock=false playwright
node scripts/browser-check.cjs
```

## Source layout

- `src/HelloWorld/`: ASP.NET host, HTML document, CSS, and backend debugging example.
- `src/HelloWorld.Client/`: Blazor WebAssembly startup, routes, layout, and Hello World page.
- `tests/HelloWorld.Tests/`: xUnit unit and integration tests.
- `scripts/`: SDK helper and optional browser/debug verification.
- `artifacts/`: Actual screenshots and verification results.
- `.vscode/`: Build/test tasks and debugger configuration.

Generated SDK files, caches, and build output are excluded by `.gitignore`. The backend's optional `GET /api/greeting?name=...` trims names, defaults blanks to World, and rejects names over 40 characters. It does not store names.
