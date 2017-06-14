'use strict';
import * as vscode from 'vscode'; // VS Code extensibility API
import { Data } from './data';
import { IJsonTheme, ITokenColor } from './interfaces';
export class Builder {

    constructor (private data: Data) {

    }

    public dispose() { }

    // General
    public async build(applyUserTheme = true): Promise<any> {
        const name = 'Themelier ' + this.data.modeName();
        const theme = this.data.getTheme(applyUserTheme);
        const scopes= this.data.scopes;

        console.log('Building ' + name);

        // Build Syntax / tokenColors
        const syntaxColors = {'global': {'name': '', 'scope': []}};
        Object.keys(scopes.syntax).forEach(scopeKey => {
            let key = 'global';
            if (theme.syntax.colors.hasOwnProperty(scopeKey)) {
                key = scopeKey;
            } else if (theme.syntax.inheritance.hasOwnProperty(scopeKey)
            && theme.syntax.colors.hasOwnProperty(theme.syntax.inheritance[scopeKey])) {
                key = theme.syntax.inheritance[scopeKey];
            }

            if (syntaxColors.hasOwnProperty(key)) {
                syntaxColors[key].name += ', ' + scopeKey;
                syntaxColors[key].scope = syntaxColors[key].scope.concat(scopes.syntax[scopeKey]);
            } else {
                syntaxColors[key] = {
                    'name': scopeKey,
                    'scope': scopes.syntax[scopeKey]
                };
            }
        });
        if (!syntaxColors.global.scope.length) delete syntaxColors.global;
        else syntaxColors.global.name = syntaxColors.global.name.slice(2);

        const tokenColors: ITokenColor[] = [];
        Object.keys(syntaxColors).forEach(item => {
            tokenColors.push({
                'name': syntaxColors[item].name,
                'scope': syntaxColors[item].scope,
                'settings': {
                    'foreground': theme.syntax.colors[item].modified.hex
                }
            });
        });

        // Build UI / colors
        const themeUiColors = {
            'editor.foreground': theme.syntax.colors.global.modified.hex
        };

        Object.keys(theme.ui.inheritance).forEach(property => {
            if (theme.ui.colors.hasOwnProperty(theme.ui.inheritance[property])) {
                theme.ui.colors[property] = theme.ui.colors[theme.ui.inheritance[property]];
            }
        });

        Object.keys(theme.ui.colors).forEach(item => {
            if (scopes.ui.hasOwnProperty(item)) {
                Object.keys(scopes.ui[item]).forEach(scope => {
                    const color = theme.ui.colors[item];
                    const pc = scopes.ui[item][scope];
                    themeUiColors[scope] = color.modify(pc, this.data.mode).hex;
                });
            }
        });

        // Finalize tokenColors
        const equivalences = [
            ['editor.background', 'background'],
            ['editor.lineHighlightBackground', 'lineHighlight'],
            ['editor.selectionBackground', 'selection'],
            ['editor.findMatchHighlightBackground', 'findHighlight'],
            ['editorIndentGuide.background', 'guide']
        ];
        const globalForTC = this.addUiToTokenColors(themeUiColors, equivalences,
            theme.syntax.colors.global.modified.hex);

        tokenColors.unshift({'settings': globalForTC});

        // Put the theme together
        const ansTheme: IJsonTheme = {
            'name': name,
            'include': './common.json',
            'colors': themeUiColors,
            'tokenColors': tokenColors
        };
        return new Promise((accept, reject) => {
            this.data.writeTheme(ansTheme)
            .then(() => accept())
            .catch((err) => reject(err));
        });
    }

    public async fullBuild(): Promise<any> {
        const promises: Promise<any>[] = [];
        // Save previous mode and theme choice to restablish them after running
        const prevMode = this.data.mode;
        const prevChoice = this.data.choice;

        // Iterate over dark and light modes, with the potentially current one first
        [prevMode, 'dark', 'light'].filter((x,i,arr) => arr.indexOf(x) === i)
        .forEach(mode => {
            // Set mode to desired
            this.data.mode = mode;
            // Get choices for this mode
            // (they will go to default if previous don't have a matching mode)
            const choice = this.data.choice;
            if (choice.valid) {
                // Discard user settings if choice wasn't explicitly set by the user
                const applyUserSettings = choice.explicit;
                promises.push(this.build(applyUserSettings));
            }
        });

        // Restore previous mode and theme choice
        this.data.mode = prevMode; // Mode must go first
        this.data.choice = prevChoice;

        return Promise.all(promises);
    }

    // Copy Editor theming to tokenColors
    private addUiToTokenColors(uiColors, equivalences: string[][], globalColor: string): { [key: string]: string } {
        const globalForTC = { 'foreground': globalColor };
        for (const [inUi, inTokens] of equivalences) {
            if (uiColors.hasOwnProperty(inUi)) {
                globalForTC[inTokens] = uiColors[inUi];
            }
        }
        return globalForTC;
    }

}
