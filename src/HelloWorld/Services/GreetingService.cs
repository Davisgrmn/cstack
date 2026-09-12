namespace HelloWorld.Services;

public sealed class GreetingService(ILogger<GreetingService> logger)
{
    public const int MaxNameLength = 40;

    public string Create(string? name)
    {
        var normalizedName = string.IsNullOrWhiteSpace(name) ? "World" : name.Trim();
        var message = $"Hello {normalizedName}";
        // Break here to inspect name, normalizedName, and message in the debugger.
        logger.LogDebug("Greeting created. Used default: {UsedDefault}; name length: {NameLength}",
            normalizedName == "World", normalizedName.Length);
        return message;
    }
}
