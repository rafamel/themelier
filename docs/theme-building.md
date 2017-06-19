# Making a theme for *Themelier*

## Syntax Themes

Be sure to check the basic scopes at [the main *Syntax Theming* documentation](https://github.com/rafamel/themelier/blob/master/README.md) and *Scopes & Inheritance* at [the *Extended Settings* documentation](https://github.com/rafamel/themelier/tree/master/docs/README.md) before you continue.

All syntax themes must define a `global` color - as it is the only first-level scope, the one all other non defined second-level scopes and their children will fall back to. Themes can define colors for from none to as many second-level scopes as there are. They **cannot** define colors for any third-level scope. Instead, to change third-level scope colors, they must alter the inheritance rules - though no second-level scope can be made to inherit from another second-level scope - they can only inherit from `global`.

Syntax themes live in the `themes/syntax` folder of the repo in a `json` file with two keys: `colors` and `inheritance` - the latter being optional and only needed in order to alter the default inheritance rules, - and are indexed in `themes/syntax.json`.

For example, the *Plastic* theme, which can be found at `themes/syntax/dark/plastic.json`, alters the [default inheritance](https://github.com/rafamel/themelier/tree/master/docs/README.md) of `mkBold`, which originally inherited from `constant`, making it inherit from `storage` instead, and the one of `mkItalic`, originally inheriting from `keyword`, to inherit from `constant`:

```javascript
{
    "colors": {
        "global": "#ABB2BF",
        "string": "#98C379",
        "comment": "#5C6370",
        "variable": "#D2D6DB",
        "property": "#E5C07B",
        "function": "#D19A66",
        "keyword": "#E06C75",
        "storage": "#61AFEF",
        "operator": "#E06C75",
        "support": "#56B6C2",
        "constant": "#56B6C2"
    },
    "inheritance": {
        "mkBold": "storage",
        "mkItalic": "constant"
    }
}
```

## UI Themes

They work in a similar fashion to syntax themes, though in this case, leaving any value undefined will maintain the VSCode defaults for that mode (dark or light), since there are only two levels of inheritance - as there is no `global` color. You can check the valid keys at [the *Extended Settings* documentation](https://github.com/rafamel/themelier/tree/master/docs/README.md).

**It's worth noting that button and notification inheritance will only occur when both `altBackground` and `badge` are dark,** since VSCode is unable to apply a distinct font color for buttons and notifications, also making information, warning, and error signs, inherit from the notification font color. This would change as soon as VSCode is able to properly implement these styles.

UI themes live in the `themes/ui` folder of the repo in a `json` file with two keys: `colors` and `inheritance` - the latter being optional and only needed in order to alter the default inheritance rules, - and are indexed in `themes/ui.json`.

As an example, the *Atomic Dark* theme, found at `themes/ui/dark/atomic-dark.json`, is defined as follows:

```javascript
{
    "colors": {
        "mainBackground": "#282C34", 
        "altBackground": "#21252B",
        "selection": "#3F4450",
        "line": "#4C5262",
        "badge": "#577AC7"
    },
    "inheritance": {
        "sidebar": "altBackground",
        "activityBar": "mainBackground"
    }
}
```
