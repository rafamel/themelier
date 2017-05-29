'use strict';
import * as vscode from 'vscode'; // VS Code extensibility API
import { Data } from './data';
let tinycolor = require("tinycolor2");

export class Builder {

    constructor (private data: Data) {

    }

    // General
    public build(themeSyntaxUi: {'syntax': {}, 'ui': {}} = this.data.themeSyntaxUi(), mode: string = this.data.savedMode) {
        let name =  'Themelier ' + mode.charAt(0).toUpperCase() + mode.slice(1), // this.data.currentTheme;
            syntaxFile = themeSyntaxUi.syntax,
            uiFile = themeSyntaxUi.ui,
            syntaxScopes = this.data.scopes['syntax'],
            uiScopes = this.data.scopes['ui'],
            inheritance = this.data.inheritance,
            theme = {};

        console.log('Building ' + name);

        // Build Syntax / tokenColors
        if (!syntaxFile.hasOwnProperty('global')) { // Check the theme has `global` key
            vscode.window.showInformationMessage('There is no "global" color on the chosen Themelier theme');
            return;
        }
        
        let syntaxColors = {'global': {'name': '', 'scope': []}};
        for (let theScopeKey in syntaxScopes) {
            let key = 'global';
            if (syntaxFile.hasOwnProperty(theScopeKey)) {
                key = theScopeKey;
            } else if (inheritance.hasOwnProperty(theScopeKey) && syntaxFile.hasOwnProperty(inheritance[theScopeKey])) {
                key = inheritance[theScopeKey];
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
        tokenColors.push({'settings': {'foreground': syntaxFile['global']}});
        
        for (let item in syntaxColors) {
            tokenColors.push({
                "name": syntaxColors[item]['name'],
                "scope": syntaxColors[item]['scope'],
                "settings": {
                    "foreground": syntaxFile[item]
                }
            });
        }

        // Build UI / colors
        function lightenDarken(color: string, mod: Number): string {
            if (mod === 0) return color;
            let tColor = tinycolor(color);

            if (mod === -1) tColor = ((tColor.isDark()) ? tColor.lighten(85) : tColor.darken(85)).greyscale();
            else tColor = (mode === 'light') ? tColor.greyscale().darken(mod) : tColor.lighten(mod);
            
            return tColor.toHexString();
        }

        let uiColors = {  'editor.foreground': syntaxFile['global'] };

        if ((!uiFile.hasOwnProperty('activityBar')) && uiFile.hasOwnProperty('backBackground')) {
            uiFile['activityBar'] = uiFile['backBackground'];
        }
        if ((!uiFile.hasOwnProperty('sidebar')) && uiFile.hasOwnProperty('foreBackground')) {
            uiFile['sidebar'] = uiFile['foreBackground'];
        }
        
        for (let item in uiFile) {
            if (uiScopes.hasOwnProperty(item)) {
                for (let scope in uiScopes[item]) {
                    let color = uiFile[item],
                        mod = uiScopes[item][scope];
                    uiColors[scope] = lightenDarken(color, mod);
                }
            }
        }
        
        // Put the theme together
        theme['name'] = name;
        theme['include'] = './common.json';
        theme['colors'] = uiColors;
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
