# Themelier

Easy to personalize syntax and UI meta theme for VSCode with awesome out-of-the-box presets

## This extension is under active development and NOT READY FOR USE

## Basic

- `global`
- `variable`
- `function`
- `keyword`: Such as `for`, `while`, and so on.
- `operator`: Such as `+`, `-`, or `=`.
- `support`: Built-in functions, modules, types, and classes.
- `comment`
- `string`
- `htmlTag`

## Extended

- Inherit from **variable**:
    - `definition`: Variables at definition time (when possible) or when placed as a receiving a parameter of a function.
    - `property`: Variable properties (excluding functions).
    - `punctuation`: Brackets, colons, dots and other punctuation.

- Inherit from **keyword**:
    - `storage`: Such as `public`, `private`, `var` or `function`.

- Inherit from **support**:
    - `constant`: Constants.
    - `reserved`: Reserved variables such as `this`, `self`, and `super`.

## Settings

...


## To Do

- Add Light themes.

## Contribute

Discussions regarding a different inheritance structure for styles are welcomed. The goal is to have a set of unique scoping rules that make the most logical sense, while being consistent and complete across as many languages as possible, so the same applies to the specificities of scoping rules.

Pull requests for new base themes for syntax and UI are also encouraged, particularly for a white UI, since there's none at the moment.

----

This is the README for your extension "themelier". After writing up a brief description, we recommend including the following sections.

## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: enable/disable this extension
* `myExtension.thing`: set to `blah` to do something

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

-----------------------------------------------------------------------------------------------------------

## Working with Markdown

**Note:** You can author your README using Visual Studio Code.  Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on OSX or `Ctrl+\` on Windows and Linux)
* Toggle preview (`Shift+CMD+V` on OSX or `Shift+Ctrl+V` on Windows and Linux)
* Press `Ctrl+Space` (Windows, Linux) or `Cmd+Space` (OSX) to see a list of Markdown snippets

### For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**