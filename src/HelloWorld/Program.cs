using HelloWorld.Client;
using HelloWorld.Components;
using HelloWorld.Services;
using MudBlazor.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddRazorComponents().AddInteractiveWebAssemblyComponents();
builder.Services.AddMudServices();
builder.Services.AddSingleton<GreetingService>();

var app = builder.Build();
if (app.Environment.IsDevelopment())
{
    app.UseWebAssemblyDebugging();
}
else
{
    app.UseExceptionHandler("/error");
}

app.UseAntiforgery();
app.MapStaticAssets();
app.MapGet("/api/greeting", (string? name, GreetingService greetings) =>
{
    if (name?.Trim().Length > GreetingService.MaxNameLength)
    {
        return Results.BadRequest(new { error = "Names must be 40 characters or fewer." });
    }
    return Results.Ok(new { message = greetings.Create(name) });
});
app.MapGet("/error", () => Results.Problem("An unexpected error occurred. Please try again."));
app.MapRazorComponents<App>()
    .AddInteractiveWebAssemblyRenderMode()
    .AddAdditionalAssemblies(typeof(Routes).Assembly);
app.Run();

// Exposes the entry point to the xUnit integration test host.
public partial class Program;
