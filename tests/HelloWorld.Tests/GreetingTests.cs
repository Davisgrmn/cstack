using System.Net;
using System.Net.Http.Json;
using HelloWorld.Services;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Logging.Abstractions;

namespace HelloWorld.Tests;

public sealed class GreetingTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Theory]
    [InlineData(null, "Hello World")]
    [InlineData("", "Hello World")]
    [InlineData("   ", "Hello World")]
    [InlineData("  Ada  ", "Hello Ada")]
    [InlineData("María", "Hello María")]
    public void Create_normalizes_names_and_defaults_to_world(string? name, string expected)
    {
        var service = new GreetingService(NullLogger<GreetingService>.Instance);
        Assert.Equal(expected, service.Create(name));
    }

    [Fact]
    public async Task Home_renders_hello_world_with_MudBlazor_and_WebAssembly_bootstrap()
    {
        using var client = factory.CreateClient();
        using var response = await client.GetAsync("/");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);
        var html = await response.Content.ReadAsStringAsync();
        Assert.Matches("<h1[^>]*>Hello World</h1>", html);
        Assert.Contains("mud-typography-h1", html);
        Assert.Matches(@"_content/MudBlazor/MudBlazor\.min(?:\.[a-zA-Z0-9]+)?\.css", html);
        Assert.Contains("blazor.web", html);
        Assert.Contains("webassembly", html);
    }

    [Theory]
    [InlineData("/api/greeting", "Hello World")]
    [InlineData("/api/greeting?name=%20%20%20", "Hello World")]
    [InlineData("/api/greeting?name=%20Ada%20", "Hello Ada")]
    [InlineData("/api/greeting?name=A%26B", "Hello A&B")]
    public async Task Api_returns_expected_greeting(string url, string expected)
    {
        using var client = factory.CreateClient();
        var response = await client.GetFromJsonAsync<GreetingResponse>(url);
        Assert.Equal(expected, response?.Message);
    }

    [Fact]
    public async Task Api_rejects_names_over_40_characters()
    {
        using var client = factory.CreateClient();
        using var response = await client.GetAsync($"/api/greeting?name={new string('a', 41)}");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Api_accepts_a_name_at_the_length_limit()
    {
        using var client = factory.CreateClient();
        var name = new string('a', 40);
        var response = await client.GetFromJsonAsync<GreetingResponse>($"/api/greeting?name={name}");
        Assert.Equal($"Hello {name}", response?.Message);
    }

    private sealed record GreetingResponse(string Message);
}
