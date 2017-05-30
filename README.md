# Themelier

*Easy to personalize syntax and UI meta theme / theme editor for VSCode, with awesome out-of-the-box presets.* 

[Themelier @ Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=rafamel.themelier)

![Rundown](https://raw.githubusercontent.com/rafamel/themelier/master/images/rundown.gif)

---

The goal of *Themelier* is to introduce a set of scoping rules that *makes sense* regardless of the specific colors used, allowing for **fast, no-hasle theme personalization,** either from a *base theme*, or from scratch.

It standarizes the behavior of themes (as they'll only change colors, but mostly not scoping rules), **provides a way to quickly access an ample set of themes**, and **allows for any syntax theme to be used with any UI theme,** as long as they're both either dark or light.

## Basic Usage

*Themelier* allows you to **quickly modify to your liking any of the base themes (both for syntax and UI)** in your `settings.json` **without having to go deep into the scopes,** by using *Themelier* default scope groupings. Check below for a list of settings. **Or you can just use *Themelier* themes out-of-the-box.**

To start, press `ctrl(⌘) + k` and then `ctrl(⌘) + t` to change your current theme to `Themelier Dark` or `Themelier Light` as you would do with any other theme. Depending on which one you have selected, *Themelier* will offer you dark or white syntax and UI base themes.

Press `ctrl(⌘) + shift + p` and type `Choose Themelier Theme`, then hit return. **You'll be offered different syntax themes to choose from first, then you'll be given the UI theme choices.**

You can currently choose from the following base themes:

- Syntax
    - Dark
        - One Dark
        - One Dark Soft
        - One Dark Vivid
        - One Monokai
        - One Monokai Soft
        - Pastic
    - Light
        - One Light
- UI
    - Dark
        - Dark UI
        - Atomic
        - Atomic Pro
    - Light
        - Light UI
        - Atomic

## Settings

You can build upon the *Themelier* base themes of your choice, both for syntax and UI by using the `themelier.syntax` and `themelier.ui` objects in your `settings.json`. Whenever you define a specific color for some scope, it will overrule the one defined by the *base theme*.

Keep in mind **colors must be in hexadecimal format,** otherwise they'll be ignored.

Every time you make changes, press `ctrl(⌘) + shift + p`, type `Rebuild Themelier Theme`, and hit return, to apply them.

### Syntax Theming

These are the basic building blocks for a **syntax theme** and are defined by the `themelier.syntax` object in your `settings.json`. If any of these keys is invalid or not defined, the one defined by the *base theme* of your choice will be used.

If you choose `Empty Base Theme` when selecting your *base theme*, it will be completely up to you to define each; if any is not defined, it will inherit from `global`.

The basic scopes are:

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

### UI Theming

You can define these in the `themelier.ui` object of your `settings.json`. You only have to define two main colors to start up:

- `foreBackground`: Main background color: Editor, Title Bar,  Notifications, and Sidebar.
- `backBackground`: Secondary background color: Activity Bar, Peek View, and Input.

Example:

```javascript
themelier.ui: {
    "foreBackground": "#333",
}
```

For the full list of properties you can define, check the [Extended UI Theming](https://github.com/rafamel/themelier/tree/master/docs).

## Built-in Themes

The built in syntax themes don't try to replicate the scoping rules of the original themes, as the point of *Themelier* is to introduce scoping rules that makes sense regardless of the colors used. They are adaptations of the original themes in a way that tries to make the most sense with *Themelier* scoping rules

## Contribute

Discussions regarding a different inheritance structure and groupings for scopes are welcomed. The goal is to have a set of unique scoping rules that make the most logical sense, while being consistent and complete across as many languages as possible.

Pull requests for new base themes for syntax and UI are also encouraged, particularly light themes, since there are not many yet.

The themes live in the `theming/syntax` and `theming/ui` folders of the repo.

----



## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.
.

## Credits

* [Code Samples](https://github.com/akamud/vscode-theme-onedark)
* [Icon Look](https://github.com/will-stone/plastic)
* Syntax theme colors:
    * [One Dark](https://atom.io/themes/one-dark-syntax)
    * [One Dark Vivid](https://atom.io/themes/one-dark-vivid-syntax)
    * [Plastic](https://github.com/will-stone/plastic)
* UI theme colors:
    * [Atomic](https://github.com/atom)
    * [Atomic Pro](https://github.com/Binaryify/OneDark-Pro)
