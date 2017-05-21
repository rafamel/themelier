'use strict';
import * as vscode from 'vscode'; // VS Code extensibility API
import { Data } from './data';

export class Builder {

    constructor(private data: Data) {

    }

    // General
    public build(themeSyntaxUi: {'syntax': {}, 'ui': {}} = this.data.themeSyntaxUi(), mode: string = this.data.savedMode) {

        let name =  'Themelier ' + mode.charAt(0).toUpperCase() + mode.slice(1), // this.data.currentTheme;
            syntaxFile = themeSyntaxUi.syntax,
            uiFile = themeSyntaxUi.ui,
            scopes = this.data.scopes,
            inheritance = this.data.inheritance,
            theme = {};

        console.log('Building ' + name);

        // Check the theme has `global` key
        if (!syntaxFile.hasOwnProperty('global')) {
            vscode.window.showInformationMessage('There is no "global" color on the chosen Themelier theme');
            return;
        }
        
        let syntaxColors = {'global': {'name': '', 'scope': []}};
        for (let theScopeKey in scopes) {
            let key = 'global';
            if (syntaxFile.hasOwnProperty(theScopeKey)) {
                key = theScopeKey;
            } else if (inheritance.hasOwnProperty(theScopeKey) && syntaxFile.hasOwnProperty(inheritance[theScopeKey])) {
                key = inheritance[theScopeKey];
            }

            if (syntaxColors.hasOwnProperty(key)) {
                syntaxColors[key]['name'] += ', ' + theScopeKey;
                syntaxColors[key]['scope'] = syntaxColors[key]['scope'].concat(scopes[theScopeKey]);
            } else {
                syntaxColors[key] = {'name': theScopeKey, 'scope': scopes[theScopeKey]};
            }

        }
        if (!syntaxColors['global']['scope'].length) delete syntaxColors['global'];

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

        theme['name'] = name;
        theme['colors'] = uiFile;
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
