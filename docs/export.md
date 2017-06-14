# Exporting a theme from *Themelier*

You can export your **current** Themelier theme (with all your `settings.json` personalizations) as as a `tmTheme` (*TextMate* format), or build a *VSCode* theme extension with it.

Press `ctrl(⌘) + shift + p`, type `Export Themelier Theme`, and hit return to start.

## TextMate format

With `tmTheme` exporting, though more universal (multiple text editors and IDEs support it), you won't be able to export your UI theming.

## VSCode Theme Extension

To create a brand new *VSCode* theme extension, you must have [**Git**](https://git-scm.com/), [**Node**](https://nodejs.org/), and [**Yeoman**](http://yeoman.io/) available in your system.

Create a new folder and open it with *VSCode*, so it is the root folder of your project. Then, press `ctrl(⌘) + shift + p`, type `Export Themelier Theme`, hit return, and choose *Create VSCode Theme*.

One your theme extension is created, you can test it by pressing `F5`. To package your theme as an `VSIX` (so you can install it as a local package) or publish it in the [*Marketplace*](https://marketplace.visualstudio.com/vscode), you must have `vsce` installed. Run `npm install -g vsce` to install it, and then `vsce package` or `vsce publish` in the root directory of your new theme to build the package or publish it in the [*Marketplace*](https://marketplace.visualstudio.com/vscode). Read the [Publishing Extensions](https://code.visualstudio.com/docs/extensions/publish-extension) documentation for further instructions.

### Updating a Theme Extension

To update a previously created theme extension, press `ctrl(⌘) + shift + p`, type `Export Themelier Theme`, hit return, and choose *Export as VSCode JSON theme file*. Overwrite with it the previous JSON in the `themes` folder of your extension. Don't forget to increment your version by modifying the `"version"` key in your extension `package.json`.

You can then normally package or publish your updated extension.
