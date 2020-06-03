---
layout: post
title: CSProj to XProj&#58; Supporting .NET Core using the Preview tools
excerpt: With the RTM of the lovely .NET Core, I've now added support for .NET Standard 1.0 to ReadableExpressions and AgileMapper. Here's a step-by-step of how I added the support using VS2015 Update 3.
tags: [C&#35;, .NET Core]
---

With [the RTM](https://blogs.msdn.microsoft.com/dotnet/2016/06/27/announcing-net-core-1-0/) of the 
lovely .NET Core, I've now added support for [.NET Standard 1.0](https://docs.microsoft.com/en-us/dotnet/articles/standard/library)
to [ReadableExpressions]({{ sit.re_nuget }}) and [AgileMapper]({{ sit.am_nuget }}). Targeting .NET 
Standard 1.0 gives support for the following for free!

- .NET Core
- .NET Framework 4.5
- Mono and Xamarin
- Universal Windows Platform 10.0
- Windows 8.0
- Windows Phone 8.1
- Windows Phone Silverlight 8.0

Both libraries previously supported .NET 4.0, so the NuGet packages also contain a .NET 4.0 assembly.

Targeting .NET Standard was... non-trivial. Y'see, while .NET Core is at RTM, the tools for Visual 
Studio 2015 are still in preview. I thought maybe Visual Studio 15 might work, so I got Preview 5 
aaaaaaand...

![Computer said no]({{ site.post_images_dir }}2016-10-07/Vs15SaysNo.png)

...[computer said no](https://www.youtube.com/watch?v=AJQ3TM-p2QI). Oh well - using the 
[Dapper](https://github.com/StackExchange/dapper-dot-net) and
[AutoMapper](https://github.com/AutoMapper/AutoMapper) codebases as examples to help me along the 
way, here's how I added the support using VS2015 Update 3.

## Replace csproj with xproj

xproj [may not be here to stay](https://blogs.msdn.microsoft.com/dotnet/2016/05/23/changes-to-project-json)
(boooooooo), but if you want to cross-compile a library - build one assembly for, e.g. .NET Standard 
1.0 and .NET 4.0 - this is currently how it's done.

So! I removed the old, out-dated Class Library project:

![Remove old project]({{ site.post_images_dir }}2016-10-07/Remove.png)

...and added a new, sparkly .NET Core one:

![Add new]({{ site.post_images_dir }}2016-10-07/AddNew.png)

...naming the new project something different to the old csproj library of course, because that 
still existed on disk. Next, I removed the *new* project:

![Remove new project]({{ site.post_images_dir }}2016-10-07/RemoveCore.png)

...and headed to windows explorer where I renamed it to match the old csproj, and moved it and its 
project.json into the original csproj folder. Then I re-added it to the solution, giving me this:

![Add XProj]({{ site.post_images_dir }}2016-10-07/AddedXProj.png)

Because of the wonder of xproj, the folder contents all show up without having to manually add them.
Hurrah!

## Sort out project.json

project.json is also apparently not here to stay (boooooooo x2), but again - this is how it's 
currently done.

The default file looks like this:

```json
{
  "version": "1.0.0-*",

  "dependencies": {
    "NETStandard.Library": "1.6.0"
  },

  "frameworks": {
    "netstandard1.6": {
      "imports": "dnxcore50"
    }
  }
}
```

ReadableExpressions was on v1.6.5 at the time and I wanted to support .NET Standard 1.0 and .NET 
4.0, so I updated it to this:

```json
{
  "version": "1.6.5-*",

  "frameworks": {
    "netstandard1.0": {
      "imports": "dnxcore50",
      "dependencies": {
        "NETStandard.Library": "1.6.0"
      },
      "buildOptions": {
        "define": [ "NET_STANDARD" ]
      }
    },
    "net40": {}

  }
}
```

You may notice I moved the `NETStandard.Library` dependency into the dependencies section for the
`netstandard1.0` target - that's not *necessary*, I just did it as a kind of OCD thing, because 
that's the only target that requires that library.

I defined the conditional compilation symbol `NET_STANDARD` so the code could distinguish between 
its .NET Standard1.0 and .NET 4.0 versions - more on that later - and manually updated the version 
number. In a csproj I can link to a shared version number file, but as far as I can tell the way 
NuGet packages are produced for .NET Core requires the version number to be in the project.json. 
Shame.

## Polyfills!

With these changes made to the project.json, I started getting errors about the `DynamicExpression` 
class not being supported:

![DynamicExpression not supported]({{ site.post_images_dir }}2016-10-07/DynamicExpression.png)

There's a couple of things to note in that screenshot:

- The highlighted drop-down at the top of the image includes the two targets I specified in the 
  project.json - you can switch between the targets to see how the code looks for each

- The error in the Error List is for project ReadableExpressions..NETStandard,Version=v1.0, 
  specifying the target where it occured

I removed this code from the .NET Standard version by wrapping the whole class with 
`#if !NET_STANDARD / #endif` - where `NET_STANDARD` is the conditional compilation symbol I 
defined in the project.json - and compiled again*. Here's where I ran into problems with the 
[changes to the reflection API](https://blogs.msdn.microsoft.com/dotnet/2012/08/28/evolving-the-reflection-api):

![Polyfill errors]({{ site.post_images_dir }}2016-10-07/PolyfillErrors.png)

Some of them were resolved by adding a reference to 
[System.Reflection.TypeExtensions](https://www.nuget.org/packages/System.Reflection.TypeExtensions):

```json
{
  "version": "1.6.5-*",

  "frameworks": {
    "netstandard1.0": {
      "imports": "dnxcore50",
      "dependencies": {
        "NETStandard.Library": "1.6.0",
        "System.Reflection.TypeExtensions": "4.1.0"
      },
      "buildOptions": {
        "define": [ "NET_STANDARD" ]
      }
    },
    "net40": {}
  }
}
```

...and this was one example of the tools being in preview really biting - manually editing the 
dependencies section of the project.json caused VS to freeze for 10-15 seconds while it tried to 
resolve the package - even though the file hadn't been saved and I haven't finished typing. I ended 
up typing package references into Notepad and pasting them into project.json or using the NuGet 
package manager instead.

The rest of the 'you can't do that in .NETStandard1.0' errors I fixed with polyfills, as per [a 
recent Jeremy D Miller blog](https://jeremydmiller.com/2016/09/28/an-experience-report-of-moving-a-complicated-codebase-to-the-coreclr).
For example:

```csharp
public static bool IsClass(this Type type)
{
#if NET_STANDARD
    return type.GetTypeInfo().IsClass;
#else
    return type.IsClass;
#endif
}
```

After updating the code to use the polyfills, the project built again. Progress!

## Restore the Unit Tests

My unit tests project referenced the old csproj, but that was now gone. They couldn't reference the 
new xproj, because csproj -> xproj project references don't work, so I added a new 
ReadableExpression.Net40 csproj project, and replaced the ItemGroup listing the included files with:

```xml
<ItemGroup>
  <Compile Include="..\CommonAssemblyInfo.cs">
    <Link>Properties\CommonAssemblyInfo.cs</Link>
  </Compile>
  <Compile Include="..\ReadableExpressions\**\*.cs" Exclude="..\ReadableExpressions\obj\**\*.cs;">
    <Link>%(RecursiveDir)%(Filename)%(Extension)</Link>
  </Compile>
  <Compile Include="..\VersionInfo.cs">
    <Link>Properties\VersionInfo.cs</Link>
  </Compile>
</ItemGroup>
```

...which included links to the CommonAssemblyInfo and VersionInfo files and all the .cs files from 
the original project - I  could then reference that from the unit tests project, and my tests were 
wired back in. They all passed! Magic!

## Tidying up + NuGet

NuGet packages are created from xproj / project.json projects using the dotnet pack command. This 
doesn't use the [.nuspec](https://docs.nuget.org/ndocs/schema/nuspec) file that NuGet.exe does, so 
I added the old package information into the project.json. `dotnet pack` also uses the name of the 
project's folder for the output assembly name, so I had to specify that in project.json's 
`buildOptions`. The final project.json can be seen on GitHub 
[here]({{ site.re_github }}/blob/master/ReadableExpressions/project.json).

## Testing (some of) the Polyfills

So far so not-so-bad, but my .NET 4.0 unit tests only test the else branches in the 
`#if NET_STANDARD` forks - not the .NET Standard paths. Most of the polyfills were very simple 
like `IsClass` above, but a few were more involved, and I wasn't comfortable leaving them untested.
I followed the instructions in [this article](https://blogs.msdn.microsoft.com/visualstudioalm/2016/09/01/announcing-mstest-v2-framework-support-for-net-core-1-0-rtm)
to add a new .NET Core Class library with a project.json pulling in MSTest - added a test class, 
and the references came through fine! Great!

Next, I added the ReadableExpressions project reference, giving me a `frameworks` section which 
looked like this:

```json
"frameworks": {
  "netcoreapp1.0": {
    "imports": [
      "dnxcore50",
      "portable-net45+win8"
    ],
    "dependencies": {
      "Microsoft.NETCore.App": {
        "version": "1.0.1",
        "type": "platform"
      },
      "dotnet-test-mstest": "1.1.1-preview",
      "MSTest.TestFramework": "1.0.4-preview",
      "System.Data.Common": "4.1.0",
      "System.Reflection.TypeExtensions": "4.1.0",
      "ReadableExpressions": {
        "target": "project"
      }
    },
    "buildOptions": {
      "define": [ "NET_STANDARD" ]
    }
  }
}
```

And that... didn't work. The package restore completed, but I had the following build errors:

![No package error]({{ site.post_images_dir }}2016-10-07/NoPackage.png)

The classes under test are internal, so I added an 
[`InternalsVisibleToAttribute`](https://msdn.microsoft.com/en-us/library/system.runtime.compilerservices.internalsvisibletoattribute%28v=vs.110%29.aspx?f=255&MSPPError=-2147217396)
to the project... and it built! But... looking like this:

![Build succeeded]({{ site.post_images_dir }}2016-10-07/BuildSucceeded.png)

...still saying the classes under test weren't accessible, 'The dependency ReadableExpressions 
could not be resolved' and 'The given key was not present in the dictionary'. The tests didn't show 
up in Test Explorer. The project looked like this:

![Project]({{ site.post_images_dir }}2016-10-07/Project.png)

A bit more research led me to [global.json](https://docs.microsoft.com/en-us/dotnet/articles/core/tools/global-json),
where you can list the folders in which the projects in your solution exist, so other .NET Core 
projects can reference them. Like this:

```json
{
  "projects": [ "ReadableExpressions" ]
}
```

That must have been it! But... the error list still looked the same. I unloaded the project and 
reloaded it, and finally!

![Project OK]({{ site.post_images_dir }}2016-10-07/ProjectOK.png)

It still claimed (and continues to claim) an error in the references, but the error list now only 
stated 'The given key was not present in the dictionary' - it built, and nothing had a red 
underline.

So, final thing... actually running the tests. The Test Explorer didn't find them, ReSharper found 
them but couldn't run them... so I went to [`dotnet test`](https://docs.microsoft.com/en-us/dotnet/articles/core/tools/dotnet-test).
And that worked:

![dotnet test]({{ site.post_images_dir }}2016-10-07/DotNetTest.gif)

At last! Not perfect, but... good enough. Maybe all this trial and error will help someone else get 
to the result more quickly :)

\* In the course of writing this blog I discovered I can get `DynamicExpression` back by 
referencing the [System.Dynamic.Runtime](https://www.nuget.org/packages/System.Dynamic.Runtime) 
package - I'll make that change at some point.