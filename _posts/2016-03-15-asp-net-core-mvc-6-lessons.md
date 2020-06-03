---
layout: post
title: ASP.NET Core and MVC 6 Lessons Learned
excerpt: I recently finished a small website using ASP.NET Core and MVC 6 - I only scratched the surface of the framework, but here's some gotchas and things I picked up along the way.
tags: [ASP.NET Core, Node.js, Dependency Injection (DI)]
---

I recently finished a small website using ASP.NET Core and MVC 6 - I only scratched the surface of 
the framework, but here's some gotchas and things I picked up along the way. If you're entirely 
unfamiliar with ASP.NET Core and MVC 6, it might be a good idea to 
[read up a bit](https://docs.asp.net/en/latest/conceptual-overview/aspnet.html) on that first.

## Gotchas!

#### node_modules Folder

The default [project.json](https://docs.asp.net/en/latest/dnx/projects.html) contains the following:

```json
"exclude": [
  "wwwroot",
  "node_modules"
]
```

...defining folders to ignore when publishing the project. "Well" I thought, "I'm not using 
[node](https://nodejs.org/en), so I can clean that up a bit":

```json
"exclude": [
  "wwwroot"
]
```

That's better! Admittedly only OCD-better, but that still counts :p No point excluding the 
`node_modules` folder if there isn't going to be one, right?

Well, once I started using [Gulp](https://docs.asp.net/en/latest/client-side/using-gulp.html) for 
[CSS minification](https://www.npmjs.com/package/gulp-cssmin) my project wouldn't build! I got this:

![_config.yml]({{ site.post_images_dir }}2016-03-15/NodeError.png)

"The design time host build failed with the following error:" - with no further error details. With 
diagnostic build output I found a 'path too long' error as detailed 
[here](https://forums.asp.net/t/2022087.aspx?+The+specified+path+file+name+or+both+are+too+long+error+when+compiling+with+nightly+build+and+node_modules),
and through that bug report I [eventually] figured out that the path in question waaaaaas... 
`node_modules`. Gulp had added node files in that directory and the compilation process was falling 
over when they were included in the build. Adding `node_modules` back into the `exclude` setting 
fixed it, but that took an annoying amount of time to figure out.

#### DI Concrete Types

I usually use [StructureMap](https://structuremap.github.io) for DI, so I'm used to injecting 
concrete types into constructors without having to think about it. ASP.NET Core comes with its own 
built-in DI container, but it doesn't support concrete dependencies without them being configured. 
Like this!

```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddSingleton<EmailSender>();
}
```

...hardly a chore, but this was a very simple application. On anything of significant complexity 
I'll use StructureMap instead of the baked-in container.

#### Routing

The normal MVC `/controller/action` routing didn't work right out of the box (not that it usually 
does) so I added attribute-based routing like this:

```csharp
[Route("[controller]")]
public class ContactController : Controller
{
    [HttpPost]
    [Route("Send")]
    public async Task<IActionResult> Send(ContactData senderData)
    {
        // Omitted
    }
}
```

...and that worked fine. But seeing as all my attributes were doing was setting up the default 
routes, I switched to setting up a default route in `StartUp.Configure()`, like this:

```csharp
public void Configure(IApplicationBuilder app)
{
    app.UseMvc(routes =>
    {
        routes.MapRoute(
            name: "Default",
            template: "[controller]/[action]",
            defaults: new { controller = "Home", action = "Index" });
    });
}
```

...but that didn't work. What? I changed it to the built-in default route method:

```csharp
public void Configure(IApplicationBuilder app)
{
    app.UseMvcWithDefaultRoute();
}
```

...and that didn't work either. I put the attributes back on, it worked. I removed them, it didn't.
Eventually through some magical incantation of removing and re-adding route configuration - 
switching it off and back on again in other words - `UseMvcWithDefaultRoute()` worked without 
routing attributes. Not sure what happened there.

#### Package.json

package.json is the configuration file used by [Bower](https://bower.io) to manage dependencies 
Node.js needs to perform Gulp's client-side tasks (see the comments for clarification of this). As
an aside I have a knee-jerk reaction against using different package managers for client- and 
server-side packages, but as client-side package management is already a task performed well by 
Bower, there's sense in using it instead of NuGet for that... I guess?

Anyway, package.json does not appear in Solution Explorer:

![_config.yml]({{ site.post_images_dir }}2016-03-15/SolutionExplorer.png)

...you get to it like this:

![_config.yml]({{ site.post_images_dir }}2016-03-15/PackageJsonMenu.png)

...that wasn't terribly intuitive to me given that project.json (which contains the server-side 
dependencies) appears in Solution Explorer just fine. You can actually make package.json appear by 
removing the following line from your xproj file:

```xml
<ItemGroup>
  <DnxInvisibleContent Include="bower.json" />
  <DnxInvisibleContent Include=".bowerrc" />
  <DnxInvisibleContent Include="package.json" /> <!-- This one! -->
</ItemGroup>
```

...and I suspect doing so has no negative side-effects, but I don't know for sure, so I didn't 
bother.

## Cool Stuff

### Tag Helpers

[Tag helpers](https://blogs.msdn.microsoft.com/cdndevs/2015/08/06/a-complete-guide-to-the-mvc-6-tag-helpers)
are a less obtrusive alternative to MVC 5's many `Html.Blah()` helper methods, and IMO give you 
much cleaner view markup:

```
@* Helper method version *@
@Html.TextBoxFor(m => m.Subject, new { @class = "wide" })

@* Tag Helper version *@
<input asp-for="Subject" class="wide" />
```

You can read more about them at the link above, but I found adding attributes to standard markup 
much nicer than using the helper methods.

#### Transparent Azure Configuration

I'm hosting my project on Azure, and wanted to use the application configuration settings available 
in the portal. After a false start using [CloudConfigurationManager](https://msdn.microsoft.com/en-us/library/microsoft.windowsazure.cloudconfigurationmanager.aspx) 
(which NuGet installed quite happily but which didn't work at all) it turned out that an ASP.NET 
Core application hosted on Azure transparently uses the application settings if they're available. 
All I had to do was set up configuration in the standard way:

```csharp
public class Startup
{
    public Startup()
    {
        Configuration = new ConfigurationBuilder()
            .AddJsonFile("appSettings.json", optional: true)
            .AddEnvironmentVariables()
            .Build();
    }

    public IConfiguration Configuration { get; set; }
```

...and values are automagically pulled from Azure settings if they exist. Adding the 
`Startup.Configuration` property instance to the built-in DI container like this:

```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddInstance(Configuration);
}
```

...makes `IConfiguration` accessible as an injected dependency, like this:

```csharp
public class EmailSender
{
    private readonly IConfiguration _settings;

    public EmailSender(IConfiguration settings)
    {
        _settings = settings;
    }

    public async Task SendAsync(ContactData senderData)
    {
        var localDomain = _settings["LocalDomain"];
```

...which saves you the task of abstracting your configuration - something I'm used to having to do.
Neat! :)

#### Controller and View Discovery

I prefer to group project content by feature instead of in folders named Controllers, Models and 
Views, but doing that in MVC 5 means you have to tell the framework where to find controllers. Not 
so in MVC 6, which finds them wherever they are without fuss. Nice! The same unfortunately isn't 
true of Views, but it's pretty easy to re-configure:

In Startup.cs:

```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.Configure<RazorViewEngineOptions>(options =>
    {
        options.ViewLocationExpanders.Add(new ViewLocationExpander());
    });
```

...and in the `ViewLocationExpander`:

```csharp
public class ViewLocationExpander : IViewLocationExpander 
{
    public IEnumerable<string> ExpandViewLocations(
        ViewLocationExpanderContext context,
        IEnumerable<string> viewLocations)
    {
        return new[]
        {
            "/Home/{0}.cshtml",
            "/Contact/{0}.cshtml"
        }
        .Concat(viewLocations)
        .ToArray();
    }
```

...you simply return an enumerable of strings containing possible View locations. That's it!

Overall I really enjoyed working with ASP.NET Core and MVC 6, and I look forward to putting it to 
work on a more complex project in future.