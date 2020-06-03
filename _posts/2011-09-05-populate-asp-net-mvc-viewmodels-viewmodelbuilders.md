---
layout: post
title: Populating ASP.NET MVC ViewModels using ViewModelBuilders
excerpt: The ViewModels in my current project had got quite complex; as well as properties copied from model objects, they increasingly had flags used by Views to know whether to render links or sub-sections. The logic which set these properties was bloating Controllers, so I factored it out into objects which populate all non-editable properties of a ViewModel; ViewModelBuilders. Here's how :)
tags: [ASP.NET MVC, Dependency Injection (DI)]
---

The ViewModels in my current project had got quite complex; as well as properties copied from model 
objects, they increasingly had flags used by Views to know whether to render links or sub-sections. 
The logic which set these properties was bloating Controllers, so I factored it out into objects 
which populate all non-editable properties of a ViewModel; `ViewModelBuilders`.

The system has the following components:

1. ViewModels - objects which provide a View with the information it needs to be rendered. These all 
  implement an empty `IViewModel` marker interface.
2. `ViewModelBuilder`s - objects which populate the non-editable properties of a particular type of 
   `IViewModel`. `ViewModelBuilder`s implement an `IViewModelBuilder` interface with a 
   `Build(IViewModel)` method.
3. A `ViewModelBuilderLibrary` - a self-populating library of all the available `ViewModelBuilder`s. 
   The Library takes requests to populate an `IViewModel`, and passes it to the appropriate 
   `ViewModelBuilder`s to be built.
4. A base Controller which uses the `ViewModelBuilderLibrary` to populate `IViewModel`s after an 
   Action executes for a GET request, and before an action executes for a POST request. This ensures 
   ViewModels are always populated when they need to be.

## An Example

Here's a User Details action method which populates an `IsEditable` property on a `UserViewModel` - 
obviously this is a very simple example to illustrate the principal. The Controller has a 
`_userRepository` it can use to find `User`s, and an `_activeUserFinder` it can use to access 
the currently-active User.

```csharp
public ActionResult Details(int userId)
{
    User userToEdit = _userRepository.FindUserById(userId);

    UserViewModel viewModel = new UserViewModel(userToEdit)
    {
        IsEditable = IsUserEditable(userToEdit)
    };

    return View(viewModel);
}

private bool IsUserEditable(User userToEdit)
{
    User activeUser = _activeUserFinder.CurrentlyActiveUser;

    return (activeUser == userToEdit) || 
            activeUser.IsInRole("Administrator");
}
```

## The ViewModelBuilder

Now let's move the `IsEditable` logic from the Controller to a `UserViewModelBuilder`; Builder classes 
are named `<ViewModelType>Builder` by convention. The `IUserRepository` and `IActiveUserFinder` 
also come across from the Controller.

```csharp
public class UserViewModelBuilder : IViewModelBuilder
{
    private readonly IActiveUserFinder _activeUserFinder;
    private readonly IUserRepository _userRepository;

    public UserViewModelBuilder(
        IActiveUserFinder activeUserFinder,
        IUserRepository userRepository)
    {
        _activeUserFinder = activeUserFinder;
        _userRepository = userRepository;
    }

    public void Build(IViewModel viewModelToBuild)
    {
        UserViewModel viewModel = (UserViewModel)viewModelToBuild;

        User userToEdit = 
            _userRepository.FindUserById(viewModel.UserId);

        viewModel.IsEditable = IsUserEditable(userToEdit);
    }

    private bool IsUserEditable(User userToEdit)
    {
        User activeUser = _activeUserFinder.CurrentlyActiveUser;

        return (activeUser == userToEdit) || 
                activeUser.IsInRole("Administrator");
    }
}
```

## The ViewModelBuilderLibrary

The `ViewModelBuilderLibrary` class pairs `ViewModelBuilder`s with the `IViewModel` type they build 
and caches them in static scope. It also caches `IViewModel` properties of `IViewModel`s in order 
to populate those. The `ProcessViewModelProperties` method uses some extension methods for `IEnumerable` 
which match the core library ones for `IEnumerable<T>`; `Any()`, `First()` and `ForEach()`. These 
extension methods are freely available [here](https://bitbucket.org/MrSteve/extensions/src). Population 
of an `IViewModel` occurs recursively down though its properties and its properties' properties.

```csharp
public class ViewModelBuilderLibrary
{
    // This is a cache of IViewModel types against the 
    // ViewModelBuilders which build them:
    private static readonly Dictionary<Type, IViewModelBuilder> 
        _viewModelBuilderCache = CreateViewModelBuilderCache();

    // This is a cache of IViewModel types against PropertyInfos 
    // describing their IViewModel properties:
    private static readonly Dictionary<Type, PropertyInfo[]> 
        _viewModelModelPropertiesCache = 
            CreateViewModelModelPropertiesCache();

    public void BuildViewModel(IViewModel viewModelToBuild)
    {
        BuildViewModel(viewModelToBuild.GetType(), viewModelToBuild);
    }

    private static void BuildViewModel(
        Type viewModelType, 
        IViewModel viewModelToBuild)
    {
        // Keys contains the Types of the IViewModels which the keyed 
        // ViewModelBuilders build:
        _viewModelBuilderCache.Keys
            .Where(bvmt => bvmt.IsAssignableFrom(viewModelType))
            .ForEach(bvmt => 
            {
                _viewModelBuilderCache[bvmt].Build(viewModelToBuild);

                ProcessViewModelProperties(bvmt, viewModelToBuild);
            });
    }

    private void ProcessViewModelProperties(
        Type viewModelType,
        IViewModel viewModelToBuild)
    {
        if (!_viewModelModelPropertiesCache.ContainsKey(viewModelType))
        {
            return;
        }

        _viewModelModelPropertiesCache[viewModelType].ForEach(pi =>
        {
            object viewModelPropertyValue = 
                pi.GetValue(viewModelToBuild, null);

            IViewModel propertyViewModel = 
                viewModelPropertyValue as IViewModel;

            if (propertyViewModel != null)
            {
                BuildViewModel(
                    propertyViewModel.GetType(), 
                    propertyViewModel);
            }
            else
            {
                IEnumerable viewModelEnumerable = 
                    (IEnumerable)viewModelPropertyValue;

                if ((viewModelEnumerable != null) && 
                     viewModelEnumerable.Any())
                {
                    viewModelType = 
                        viewModelEnumerable.First().GetType();

                    viewModelEnumerable.ForEach(vm => 
                        BuildViewModel(viewModelType, (IViewModel)vm));
                }
            }
        });
    }

    #region Setup Methods

    private static Dictionary<Type, IViewModelBuilder> 
        CreateViewModelBuilderCache()
    {
        IEnumerable<Type> allAvailableClassTypes = Assembly
            .GetExecutingAssembly()
            .GetAvailableTypes(typeFilter: t => !t.IsInterface);

        IEnumerable<Type> allViewModelTypes = allAvailableClassTypes
            .Where(t => typeof(IViewModel).IsAssignableFrom(t))
            .ToArray();

        return allAvailableClassTypes
            .Where(t => typeof(IViewModelBuilder).IsAssignableFrom(t))
            .Select(t => (IViewModelBuilder)InjectionService.Resolve(t))
            .ToDictionary(
                vmb => GetViewModelBuilderBuiltType(
                    allViewModelTypes, 
                    vmb),
                vmb => vmb);
    }

    private static Type GetViewModelBuilderBuiltType(
        IEnumerable<Type> allViewModelTypes,
        IViewModelBuilder viewModelBuilder)
    {
        // Builder classes are named <ViewModelType>Builder 
        // by convention:
        string viewModelTypeName = viewModelBuilder.GetType().Name
            .Replace("Builder", null);

        Type viewModelType = allViewModelTypes
            .FirstOrDefault(vmt => vmt.Name == viewModelTypeName);

        if (viewModelType == null)
        {
            throw new NotSupportedException(
                "Unable to find a matching ViewModel Type " + 
                "for ViewModelBuilder " + 
                viewModelBuilder.GetType().FullName);
        }

        return viewModelType;
    }

    private static Dictionary<Type, PropertyInfo[]> 
        CreateViewModelModelPropertiesCache()
    {
        return _viewModelBuilderCache.Keys.ToDictionary(
            vmt => vmt,
            vmt => vmt
                .GetProperties(
                    BindingFlags.Public | BindingFlags.Instance)
                .Where(PropertyIsIViewModelType())
                .ToArray());
    }

    private static Func<PropertyInfo, bool> PropertyIsIViewModelType()
    {
        // The PropertyInfo is one we want to cache if the property is 
        // an IViewModelBuilder type, or a generic IEnumerable with an 
        // IViewModelBuilder generic argument:
        return pi => 
            typeof(IViewModel).IsAssignableFrom(pi.PropertyType)
            ||
            (typeof(IEnumerable).IsAssignableFrom(pi.PropertyType)
            &&
            pi.PropertyType.IsGenericType
            &&
            typeof(IViewModel).IsAssignableFrom(
                pi.PropertyType.GetGenericArguments().First()));
    }

    #endregion
}
```

## The Base Controller

Finally, these two methods in a base Controller class plug the `ViewModelBuilderLibrary` into the 
ASP.NET MVC pipeline; the base Controller class has the ViewModelBuilderLibrary as one of its properties.

```csharp
protected override void OnActionExecuting(
    ActionExecutingContext filterContext)
{
    if (filterContext.HttpContext.Request
            .RequestType.ToUpperInvariant() == "POST")
    {
        IViewModel viewModel;

        if (IsIViewModelViewRequest(filterContext, out viewModel))
        {
            ViewModelBuilderLibrary.BuildViewModel(viewModel);
        }
    }

    base.OnActionExecuting(filterContext);
}

protected override void OnActionExecuted(
    ActionExecutedContext filterContext)
{
    if (filterContext.HttpContext.Request
            .RequestType.ToUpperInvariant() == "GET")
    {
        IViewModel viewModel;

        if (IsIViewModelViewResult(filterContext, out viewModel))
        {
            ViewModelBuilderLibrary.BuildViewModel(viewModel);
        }
    }

    base.OnActionExecuted(filterContext);
}

private static bool IsIViewModelViewRequest(
   ActionExecutingContext context,
   out IViewModel viewModel)
{
    if (context.ActionParameters == null ||
       !context.ActionParameters.Any())
    {
        viewModel = null;
        return false;
    }

    viewModel = context.ActionParameters
        .Select(kvp => kvp.Value)
        .OfType<IViewModel>()
        .FirstOrDefault();

    return viewModel != null;
}

private static bool IsIViewModelViewResult(
    ActionExecutedContext context,
    out IViewModel viewModel)
{
    ViewResult viewResult = context.Result as ViewResult;

    if (viewResult == null)
    {
        viewModel = null;
        return false;
    }

    viewModel = viewResult.ViewData.Model as IViewModel;

    return viewModel != null;
}
```

## Summing Up

I've found using `ViewModelBuilder`s to have several advantages:

1. More isolated responsibilities; ViewModel population occurs in dedicated objects, better satisfying 
   the Single Responsibility Principle.
 
2. Easier to test; I can test ViewModel population without creating or invoking any methods on a 
   Controller.
 
2. Less data written into hidden fields; as ASP.NET MVC is stateless I've previously used hidden 
   fields on the client to persist property values; now the only data required on the client is 
   identifiers for the objects to which a View relates - everything else is reliably, consistently 
   and transparently populated on the server.