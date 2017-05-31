# Themelier

![Logo](https://raw.githubusercontent.com/rafamel/themelier/master/docs/images/icon_128.png)

*Easy to personalize syntax and UI meta theme / theme editor for VSCode, with awesome out-of-the-box presets.*

[Themelier @ Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=rafamel.themelier)

---

The goal of *Themelier* is to introduce a set of scoping rules that *makes sense* regardless of the specific colors used, allowing for **fast, no-hasle theme personalization** with a focus on simplicity, either from a *base theme*, or from scratch.

It standarizes the behavior of themes (as they'll only change colors, but mostly not scoping rules), **provides a way to quickly access, use, and personalize an ample set of themes**, and **allows for any syntax theme to be used with any UI theme,** as long as they're both either dark or light.

![Rundown](https://raw.githubusercontent.com/rafamel/themelier/master/docs/images/rundown.gif)

## Basic Usage

*Themelier* allows you to **quickly modify to your liking any of the base themes (both for syntax and UI)** in your `settings.json` **without having to go deep into the scopes,** by using *Themelier* default scope groupings. Check below for a list of settings. **Or you can just use *Themelier* themes out-of-the-box.**

To start, press `ctrl(⌘) + k` and then `ctrl(⌘) + t` to change your current theme to `Themelier Dark` or `Themelier Light` as you would do with any other theme. Depending on which one you have selected, *Themelier* will offer you dark or white syntax and UI base themes.

Press `ctrl(⌘) + shift + p` and type `Choose Themelier Theme`, then hit return. **You'll be offered different syntax themes to choose from first, then you'll be given the UI theme choices.**

You can currently choose between *One Dark*, *One Monokai*, *Plastic*, or *One Light* as your syntax base themes, among others.

## Settings

You can build upon the *Themelier* base themes of your choice, both for syntax and UI by using the `themelier.syntax` and `themelier.ui` objects in your `settings.json`. Whenever you define a specific color for some scope, it will overrule the one defined by the *base theme*.

Keep in mind **colors must be in hexadecimal format,** otherwise they'll be ignored.

Every time you make changes, press `ctrl(⌘) + shift + p`, type `Rebuild Themelier Theme`, and hit return, to apply them.

### Syntax Theming

#### Scopes Colors

These are the basic building blocks for a **syntax theme** and are defined by the `themelier.syntax` object in your `settings.json`. If any of these keys is invalid or not defined, the one defined by the *base theme* of your choice will be used.

If you choose `Empty Base Theme` when selecting your *base theme*, it will be completely up to you to define each; if any is not defined, it will inherit from `global`.

Here's the **basic set scopes**:

- `global`: The color all non-defined scopes fall back to; text.
- `string`: Strings, also inlines and quotes in a markup language (like Markdown).
- `comment`: Comments.
- `punctuation`: Brackets, colons, dots and other punctuation.
- `variable`: Variables.
- `property`: Object keys and variable properties (excluding functions).
- `function`: Function names.
- `keyword`: Such as `for`, `while`, and so on.
- `storage`: Such as `public`, `private`, `var` or `function`.
- `operator`: Such as `+`, `-`, or `=`.
- `support`: Built-in functions, modules, types, and classes. Also primitives.
- `constant`: Constants.

An example of `themelier.syntax` using these could be:

```javascript
themelier.syntax: {
    "storage": "#FFF",
    "support": "#E5C07B"
}
```

[Here's the full list of scopes and default inheritance rules](https://github.com/rafamel/themelier/tree/master/docs/README.md), should you ever need it.

#### Light and Saturation

**You can lighten, darken, saturate, and desaturate all syntax theme colors** through `themelier.light` and `themelier.saturation`. They both accept number values from -100 to 100.

- `themelier.light`: Negative numbers will darken; positive numbers will lighten. `-100` will always be black; `100` will always be white.
- `themelier.saturation`: Negative numbers will desaturate; positive numbers will saturate. `-100` will turn colors greyscale.

This would desaturate syntax theme colors by 10 and lighten them by 2:
```javascript
themelier.light: 2,
themelier.saturation: -10
```

### UI Theming

You can define these in the `themelier.ui` object of your `settings.json`. UI themes rely on two main colors:

- `foreBackground`: Main background color: Editor, Title Bar,  Notifications, and Sidebar.
- `backBackground`: Secondary background color: Activity Bar, Peek View, and Input.

Example:

```javascript
themelier.ui: {
    "foreBackground": "#333",
}
```

For the full list of properties you can define, check the [extended settings for *UI Theming*](https://github.com/rafamel/themelier/tree/master/docs/README.md).

## Contribute

**Pull requests for new *base themes* both for syntax and UI are encouraged,** particularly light themes, as there are not many yet. Themes live in the `themes/syntax` and `themes/ui` folders of the repo. [Here's some further documentation](https://github.com/rafamel/themelier/tree/master/docs/theme-building.md) on building themes for Themelier.

Discussions regarding a different inheritance structure and groupings for scopes are also welcomed. The goal is to have the set of unique scoping rules that makes the most logical sense, while being consistent and complete across as many languages as possible.

## Built-in Themes clarification

The built in syntax themes don't try to replicate the scoping rules of the original themes, as the point of *Themelier* is to introduce scoping rules that makes sense regardless of the colors used. They are adaptations of the original themes in a way that tries to make the most sense with *Themelier* scoping rules.

## To do

- Remove current version and theme choice when uninstalling
- Export / Publish current theme [Open as json / Open as tmTheme / Create Theme VSCode Extension]
- Inheritance rules for UI

## Credits

* [Code Samples](https://github.com/akamud/vscode-theme-onedark)
* [Icon look](https://github.com/will-stone/plastic)
* Syntax theme colors:
    * [One Dark](https://atom.io/themes/one-dark-syntax)
    * [One Dark Vivid](https://atom.io/themes/one-dark-vivid-syntax)
    * [Plastic](https://github.com/will-stone/plastic)
* UI theme colors:
    * [Atomic](https://github.com/atom)
    * [Atomic Pro](https://github.com/Binaryify/OneDark-Pro)
