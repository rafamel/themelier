'use strict';
import * as vscode from 'vscode'; // VS Code extensibility API
import { Data } from './data';

export class Builder {

    constructor(private data: Data) {

    }

    // General
    public build(syntaxUiForPick: {'syntax': {}, 'ui': {}} = this.data.syntaxUiForPick(), mode: string = this.data.savedMode) {

        console.log('Building Themelier Theme');
        let syntaxFile = syntaxUiForPick.syntax,
            uiFile = syntaxUiForPick.ui,
            scopes = this.data.scopes,
            inheritance = this.data.inheritance,
            theme = {};

        // Check the theme has `global` key
        if (!syntaxFile.hasOwnProperty('global')) {
            vscode.window.showInformationMessage('There is no "global" color on the chosen theme.');
            return;
        }

        let syntaxColors = {'global': {'name': '', 'scope': []}};
        for (let theScopeKey in scopes) {
            let key = 'global';
            if (syntaxFile.hasOwnProperty(theScopeKey)) {
                key = theScopeKey;
            } else if (inheritance.hasOwnProperty(theScopeKey)) {
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

        theme['name'] = this.data.currentTheme;
        theme['colors'] = uiFile;
        theme['tokenColors'] = tokenColors;

        this.data.writeTheme(mode, theme);

    }


    public firstBuild() {

    }

    dispose() {
    }

}
