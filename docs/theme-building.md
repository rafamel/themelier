# Making a theme for *Themelier*

## Syntax Themes

Be sure to check the instructions on basic [*Syntax Theming*](https://github.com/rafamel/themelier/blob/master/README.md) and extended [*Scopes & Inheritance*](https://github.com/rafamel/themelier/tree/master/docs/README.md) before you continue.

All syntax themes must define a `global` color - as `global` is the only first-level scope, the one all other non defined second-level scopes and their children will fall back to. Themes can also further define colors for as many second-level scopes as they wish. They **cannot** define colors for any third-level scope. Instead, to change third-level scope colors, they must alter the inheritance rules.

Syntax themes live in the `themes/syntax` folder of the repo, in a `json` file with two keys: `colors` and `inheritance` - the latter being optional, only needed in order to alter the default inheritance rules, - and are indexed in `themes/syntax.json`.

For example, the *Plastic* theme, which can be found at `themes/syntax/plastic.json`, alters the defaul inheritance of `mkItalic` from `keyword`, making it inherit from `storage` instead:

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