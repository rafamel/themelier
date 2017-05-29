# Themelier

Easy to personalize syntax and UI meta theme / theme editor for VSCode, with awesome out-of-the-box presets

Similar to [vscode-theme-generator](https://github.com/Tyriar/vscode-theme-generator)

## This extension is under active development and NOT READY FOR USE

## Settings

You can build upon the *Themelier* base theme of your choice, both for syntax and UI by using the `themelier.syntax` and `themelier.ui` user settings. Whenever you define a specific color for some scope, it will overrule the one defined by the *base theme*.

Keep in mind **colors must be in hexadecimal format,** otherwise they'll be ignored.

### Syntax Theme

These are the basic building blocks for a **syntax theme** and are defined by the `themelier.syntax` object in your `settings.json`. If any of these keys is not defined, the one defined by the *base theme* of your choice will be used.

If you choose `Empty Base Theme` when selecting your *base theme*, it will be completely up to you to define each; if any is not defined, it will inherit from `global`.

- `global`
- `string`
- `comment`
- `punctuation`
- `variable`
- `property`
- `function`
- `keyword`
- `operator`
- `support`
- `constant`

All other scopes will inherit from these following the [inheritance rules](https://github.com/rafamel/themelier/tree/master/docs). Keep in mind some *base themes* could have defined some extra scopes (which would override the default inheritance from these), and you can too: [here's the full list of scopes you can use in your settings with their definition,](https://github.com/rafamel/themelier/tree/master/docs) should you ever need it.

An example of using `themelier.syntax` on your `settings.json` to define your own colors could be:

```javascript
themelier.syntax: {
    "keyword": "#FFF",
    "comment": "#5C6370"
}
```

### UI Theme

You can define these in the `themelier.ui` object of your `settings.json`. You only have to define two main colors to start up:

- `foreBackground`: Main background color: Editor, Title Bar,  Notifications, and Sidebar.
- `backBackground`: Secondary background color: Activity Bar, Peek View, and Input.

Example:

```javascript
themelier.ui: {
    "foreBackground": "#333",
}
```

You can also define selections, border, and buttons, as well as change the `foreBackground`/`backBackground` groupings. Check the [Extended UI Theming](https://github.com/rafamel/themelier/tree/master/docs).

## Contribute

Discussions regarding a different inheritance structure for styles are welcomed. The goal is to have a set of unique scoping rules that make the most logical sense, while being consistent and complete across as many languages as possible, so the same applies to the specificities of scoping rules.

Pull requests for new base themes for syntax and UI are also encouraged, particularly for a white UI, since there's none at the moment.

----

## Features

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Built-in Themes

The built in syntax themes don't try to replicate the scoping rules of the original themes, as the point of *Themelier* is to introduce universal scoping rules that *make sense* regardless of the specific colors used. They are adaptations of the original themes in the way that tries to make the most sense with *Themelier* scoping rules.

## Credits

* [Code Samples](https://github.com/akamud/vscode-theme-onedark)
* Syntax theme colors:
    * [One Dark](https://atom.io/themes/one-dark-syntax)
    * [One Dark Vivid](https://atom.io/themes/one-dark-vivid-syntax)
    * [Plastic](https://github.com/will-stone/plastic)
* UI theme colors:
    * [Atomic](https://github.com/atom)
    * [Atomic Pro](https://github.com/Binaryify/OneDark-Pro)
