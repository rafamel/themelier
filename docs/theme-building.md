# Making a theme for *Themelier*

## Syntax Themes

Be sure to check the instructions on [*Syntax Theming*](https://github.com/rafamel/themelier/blob/master/README.md) and the [*Full List of Scopes*](https://github.com/rafamel/themelier/tree/master/docs/README.md) first.

All syntax themes must define a color for `global` (the only first-level scope) and can define colors for as many the second-level scopes as they wish (any non-defined second-level scope and their children will default to global). They **cannot** define colors for any third-level scope. Instead, to change third-level scopes colors, they must change the inheritance rules.

Themes live in a `json` file with two keys: `colors` and `inheritance` - the latter being only needed if you wish to override the default inheritance rules.

Syntax themes live in the `theming/syntax` folder of the repo. and are indexed in `theming/syntax.json`. For example, this is the *Plastic* theme, which can be found at `theming/syntax/plastic.json` and overrides the defaul inheritance of `mkItalic` from `keyword` making it inherit from `storage` instead.

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
        "mkItalic": "storage"
    }
}
```