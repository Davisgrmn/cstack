A barebones C# / ASP.NET Core app. It uses Blazor WebAssembly, Razor components, and MudBlazor.

## Run locally

Install the [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0), then run:

dotnet run --project src/HelloWorld --launch-profile http

## Tests

dotnet test HelloWorld.slnx

Tests cover the real HTML route (including the heading, MudBlazor markup, and WebAssembly bootstrap), greeting normalization, and API validation.


## Source layout

- `src/HelloWorld/`: ASP.NET host, HTML document, CSS, and backend debugging example.
- `src/HelloWorld.Client/`: Blazor WebAssembly startup, routes, layout, and Hello World page.
- `tests/HelloWorld.Tests/`: xUnit unit and integration tests.
- `scripts/`: SDK helper and optional browser/debug verification.
- `artifacts/`: Actual screenshots and verification results.
- `.vscode/`: Build/test tasks and debugger configuration.
