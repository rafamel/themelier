'use strict';
import * as vscode from 'vscode'; // VS Code extensibility API
import { Data } from './data';
const tinycolor = require("tinycolor2");

export class Builder {

    constructor (private data: Data) {

    }

    // Color Modifications
    private uiLightenDarken(color: string, mod: Number, mode: string): string {
        if (mod === 0) return color;
        let tColor = tinycolor(color);

        if (mod === -1) tColor = ((tColor.isDark()) ? tColor.lighten(85) : tColor.darken(85)).greyscale();
        else tColor = (mode === 'light') ? tColor.greyscale().darken(mod) : tColor.lighten(mod);

        return tColor.toHexString();
    }

    private syntaxColorModify(color: string): string {
        let worspaceConfig = vscode.workspace.getConfiguration('themelier'),
            light = worspaceConfig['light'],
            saturation = worspaceConfig['saturation'];

        if (light === 0 && saturation === 0) return color;
        let tColor = tinycolor(color);

        if (light !== 0) tColor = (light > 0) ? tColor.lighten(light) : tColor.darken(Math.abs(light));
        if (saturation !== 0) tColor = (saturation > 0) ? tColor.saturate(saturation) : tColor.desaturate(Math.abs(saturation));

        return tColor.toHexString();
    }

    // General
    public build(themeSyntaxUi: {'syntax': {'colors': {}, 'inheritance': {}}, 'ui': { 'colors': {}, 'inheritance': {}}} = this.data.themeSyntaxUi(), mode: string = this.data.savedMode) {
        let name =  'Themelier ' + mode.charAt(0).toUpperCase() + mode.slice(1), // this.data.currentTheme;
            {syntax, ui} = themeSyntaxUi,
            syntaxScopes = this.data.scopes['syntax'],
            uiScopes = this.data.scopes['ui'],
            theme = {};

        console.log('Building ' + name);

        // Build Syntax / tokenColors
        let syntaxColors = {'global': {'name': '', 'scope': []}};
        for (let theScopeKey in syntaxScopes) {
            let key = 'global';
            if (syntax['colors'].hasOwnProperty(theScopeKey)) {
                key = theScopeKey;
            } else if (syntax['inheritance'].hasOwnProperty(theScopeKey) && syntax['colors'].hasOwnProperty(syntax['inheritance'][theScopeKey])) {
                key = syntax['inheritance'][theScopeKey];
            }

            if (syntaxColors.hasOwnProperty(key)) {
                syntaxColors[key]['name'] += ', ' + theScopeKey;
                syntaxColors[key]['scope'] = syntaxColors[key]['scope'].concat(syntaxScopes[theScopeKey]);
            } else {
                syntaxColors[key] = {'name': theScopeKey, 'scope': syntaxScopes[theScopeKey]};
            }
        }
        if (!syntaxColors['global']['scope'].length) delete syntaxColors['global']
        else syntaxColors['global']['name'] = syntaxColors['global']['name'].slice(2);

        let tokenColors = [];
        tokenColors.push({'settings': {'foreground': this.syntaxColorModify(syntax['colors']['global'])}});

        for (let item in syntaxColors) {
            tokenColors.push({
                "name": syntaxColors[item]['name'],
                "scope": syntaxColors[item]['scope'],
                "settings": {
                    "foreground": this.syntaxColorModify(syntax['colors'][item])
                }
            });
        }

        // Build UI / colors
        let themeUiColors = { 'editor.foreground': this.syntaxColorModify(syntax['global']) },
            uiColors = JSON.parse(JSON.stringify(ui['colors'])); // Clone object before manipulating

        for (let property in ui['inheritance']) {
            if (uiColors.hasOwnProperty(ui['inheritance'][property])) {
                uiColors[property] = uiColors[ui['inheritance'][property]];
            }
        }

        for (let item in uiColors) {
            if (uiScopes.hasOwnProperty(item)) {
                for (let scope in uiScopes[item]) {
                    let color = uiColors[item],
                        mod = uiScopes[item][scope];
                    themeUiColors[scope] = this.uiLightenDarken(color, mod, mode);
                }
            }
        }

        // Put the theme together
        theme['name'] = name;
        theme['include'] = './common.json';
        theme['colors'] = themeUiColors;
        theme['tokenColors'] = tokenColors;

        this.data.writeTheme(mode, theme);

    }


    public fullBuild() {

        ['dark', 'light'].forEach(mode => {

            let syntaxKeys = this.data.syntaxKeys(mode),
                uiKeys = this.data.uiKeys(mode);

            if (syntaxKeys.length && uiKeys.length) {
                // Choose first syntax and UI for each mode (dark/light) and discard user settings
                let syntaxPick = syntaxKeys[0],
                    uiPick = uiKeys[0],
                    applyUserSettings = false;

                // ...unless this mode is the same one as the saved mode
                if (mode === this.data.savedMode) {
                    applyUserSettings = true;
                    let savedPick = this.data.savedPick;
                    if (syntaxKeys.indexOf(savedPick[0]) !== -1) syntaxPick = savedPick[0];
                    if (uiKeys.indexOf(savedPick[1]) !== -1) uiPick = savedPick[1];
                }

                let themeSyntaxUi = this.data.themeSyntaxUi([syntaxPick, uiPick], mode, applyUserSettings);
                this.build(themeSyntaxUi, mode);
            }
        });

    }

    dispose() {
    }

}
