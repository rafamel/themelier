'use strict';

import * as vscode from 'vscode'; // VS Code extensibility API
import * as fs from 'fs-extra';
import * as merge from 'deepmerge';
import * as path from 'path';
import { ColorHex } from './color';
import {
    IBaseTheme,
    IBaseThemes,
    IChoice,
    IDarkLightObjs,
    IInheritance,
    IInheritanceRoot,
    IJsonTheme,
    IScopes,
    ISingleBaseThemeRoot,
    ISingleFoundationTheme,
    ITheme
} from './interfaces';

export class Data {

    private baseDir: string;
    private themesDir: string;
    private _syntax: IDarkLightObjs;
    private _ui: IDarkLightObjs;
    private _baseTheme: IBaseTheme;
    private _scopes: IScopes;
    private _inheritance: IInheritance;

    constructor (private context: vscode.ExtensionContext) {
        this.baseDir = path.join(__dirname, '../../');
        this.themesDir = path.join(this.baseDir, 'themes');
    }

    public dispose() { }

    // FSError
    public fsError(err: any, type: string, file: string): string {
        return type + ` error (${file}). ` + String(err).replace('Error:','');
    }

    // Empty dir?
    public emptyDir(dir = vscode.workspace.rootPath): boolean {
        const files = fs.readdirSync(dir);
        const ignore = ['.DS_Store', '.DS_Store?', '.Trashes',
                        '.gitignore', '.git', 'ehthumbs.db', 'Thumbs.db'];
        return files.filter(x => ignore.indexOf(x) === -1).length === 0;
    }

    // Writing final theme file
    public async writeTheme(theme: IJsonTheme): Promise<any> {
        const dir = path.join(this.baseDir, 'dest');
        const mode = this.mode;
        return new Promise((accept, reject) => {
            fs.writeFile(path.join(dir, mode + '.json'),
                            JSON.stringify(theme, null, 2), 'utf8')
            .then((index) => accept())
            .catch((err) => reject(this.fsError(err, 'Write', mode)));
        });
    }

    public readTheme(name: string = this.mode): IJsonTheme {
        return this.readJson(name + '.json', path.join(this.baseDir, 'dest')) as IJsonTheme;
    }

    // Current Theme
    public set currentTheme(themeName: string) {
        if (this.currentTheme !== themeName) {
            vscode.workspace.getConfiguration().update('workbench.colorTheme', themeName, true);
        }
    }
    public get currentTheme(): string {
        return vscode.workspace.getConfiguration().get<string>('workbench.colorTheme');
    }

    // Last Build Settings
    public setBuiltSettings() {
        const settings = JSON.stringify(vscode.workspace.getConfiguration('themelier'));
        this.context.globalState.update('thlBuilt', settings);
    }
    public get settingsChanged(): boolean {
        const builtSettings = this.context.globalState.get('thlBuilt') as string;
        const settings = JSON.stringify(vscode.workspace.getConfiguration('themelier'));
        return settings !== builtSettings;
    }

    // Current Mode & Choice
    public set mode(mode: string) {
        mode = mode.toLowerCase();
        this.context.globalState.update('thlMode', mode);
    }
    public get mode(): string {
        let mode =  this.context.globalState.get('thlMode') as string;
        mode = (mode) ? mode : '';
        if (mode !== 'dark' && mode !== 'light') {
            mode = 'dark';
            this.mode = mode; // Update
        }
        return mode;
    }
    public modeName(mode = this.mode): string {
        return mode.charAt(0).toUpperCase() + mode.slice(1);
    }
    public modeTheme(mode = this.mode): string {
        return 'Themelier ' + this.modeName(mode);
    }

    public set choice(opts: IChoice) {
        opts.forMode = this.mode;
        if (!opts.hasOwnProperty('explicit')) opts.explicit = false;
        this.context.globalState.update('thlOptions', opts);
    }

    public get choice(): IChoice {
        let opts = this.context.globalState.get('thlOptions') as IChoice;
        opts = (opts) ? opts : {'syntax': '', 'ui': ''};
        opts.valid = true;
        let update = false;
        ['syntax', 'ui'].forEach(syntaxOrUi => {
            if ((!opts[syntaxOrUi]) || (!this.baseThemes[syntaxOrUi].hasOwnProperty(opts[syntaxOrUi]))) {
                const themesNames = Object.keys(this.baseThemes[syntaxOrUi]);
                if (themesNames.length) {
                    opts[syntaxOrUi] = themesNames[0];
                    update = true;
                } else {
                    opts.valid = false;
                }
            }
        });
        if (update) {
            opts.explicit = false;
            opts.forMode = this.mode;
            this.choice = opts;
        }
        return opts;
    }

    // Scopes
    public get scopes(): IScopes {
        if (!this._scopes) this._scopes = this.readJson('scopes.json') as IScopes;
        return this._scopes;
    }

    // Inheritance
    public get inheritance(): IInheritance {
        if (!this._inheritance) {
            const inheritance = this.readJson('inheritance.json') as IInheritanceRoot;
            this._inheritance = {'syntax': {}, 'ui': {}};
            Object.keys(this._inheritance).forEach(syntaxOrUi => {
                const thisInheritance = inheritance[syntaxOrUi];
                Object.keys(thisInheritance).forEach(item => {
                    inheritance[syntaxOrUi][item]
                        .forEach(x => { this._inheritance[syntaxOrUi][x] = item; });
                });
            });
        }
        return this._inheritance;
    }

    // Available Syntax and UI Themes
    public get baseThemes(): IBaseThemes {
        if (!this._syntax) {
            this._syntax = this.readJson('syntax.json') as IDarkLightObjs;
        }
        if (!this._ui) {
            this._ui = this.readJson('ui.json') as IDarkLightObjs;
        }
        return {
            'syntax': this._syntax[this.mode],
            'ui': this._ui[this.mode]
        };
    }

    // Theme Building
    public get themeValid(): [boolean, string] {
        return this.baseTheme.valid;
    }

    public getTheme(applyUserTheme): ITheme {
        // Clone base theme, so any subsequent changes to the returned theme
        // at any level doesn't affect the stored baseTheme
        const baseTheme = merge(this.baseTheme, {}, {'clone': true});
        // Make object copy
        const ansTheme = {
            'syntax': baseTheme.syntax,
            'ui': baseTheme.ui
        };

        // Inheritance
        Object.keys(ansTheme).forEach(syntaxOrUi => {
            ansTheme[syntaxOrUi].inheritance = (ansTheme[syntaxOrUi].hasOwnProperty('inheritance'))
                ? merge(this.inheritance[syntaxOrUi], baseTheme[syntaxOrUi].inheritance)
                : this.inheritance[syntaxOrUi];
        });

        // Syntax and UI User Settings (colors)
        if (applyUserTheme) {
            const userTheme = this.userTheme;
            ansTheme.syntax.colors = merge(ansTheme.syntax.colors, userTheme.syntax.colors);
            ansTheme.ui.colors = merge(ansTheme.ui.colors, userTheme.ui.colors);
        }

        // Ensure colors are ColorHex
        Object.keys(ansTheme).forEach(syntaxOrUi => {
            Object.keys(ansTheme[syntaxOrUi].colors).forEach((item) => {
                ansTheme[syntaxOrUi].colors[item] = new ColorHex(
                    ansTheme[syntaxOrUi].colors[item].hex
                );
            });
        });
        return ansTheme;
    }

    private get baseTheme(): IBaseTheme {
        const getSingles = (syntaxOrUi): ISingleFoundationTheme => {
            let file = this.baseThemes[syntaxOrUi][this.choice[syntaxOrUi]];
            file = path.join(syntaxOrUi, this.mode, file);
            const baseTheme  = this.readJson(file) as ISingleBaseThemeRoot;
            const ansTheme: ISingleFoundationTheme = {'colors': {}};
            if (baseTheme.hasOwnProperty('inheritance')) {
                ansTheme.inheritance = baseTheme.inheritance;
            }
            if (baseTheme.hasOwnProperty('colors')) { // Safety Check
                Object.keys(baseTheme.colors).forEach(scope => {
                    ansTheme.colors[scope] = new ColorHex(baseTheme.colors[scope]);
                });
            }
            return ansTheme;
        };
        if ((!this._baseTheme) || (!this._baseTheme.hasOwnProperty('valid'))
            || JSON.stringify(this._baseTheme.forChoice) !== JSON.stringify(this.choice)) {
            this._baseTheme = {
                'syntax': getSingles('syntax'),
                'ui': getSingles('ui'),
                'forChoice': this.choice
            };
            this._baseTheme.valid = this.validBaseTheme();
        }
        return this._baseTheme;
    }

    private get userTheme(): ITheme {
        const getSingles = (syntaxOrUi): ISingleFoundationTheme => {
            const ans = {'colors': {}};
            if (worspaceConfig.hasOwnProperty(syntaxOrUi)) {
                Object.keys(worspaceConfig[syntaxOrUi]).forEach(item => {
                    const color = new ColorHex(worspaceConfig[syntaxOrUi][item]);
                    if (color.isValid() && this.scopes[syntaxOrUi].hasOwnProperty(item)) {
                        ans.colors[item] = color;
                    }
                });
            }
            return ans;
        };
        const worspaceConfig = vscode.workspace.getConfiguration('themelier');
        return {
            'syntax': getSingles('syntax'),
            'ui': getSingles('ui')
        };
    }

    // Themes
    private validBaseTheme(): [boolean, string] {
        const theme = this._baseTheme;
        for (const syntaxOrUi of ['syntax', 'ui']) {
            const inheritanceKeys = Object.keys(this.inheritance[syntaxOrUi]);
            const scopeKeys = Object.keys(this.scopes[syntaxOrUi]);
            const baseMsg = 'The chosen ' + syntaxOrUi + ' theme ';
            const bottomLevel = (syntaxOrUi === 'syntax') ? 'third' : 'bottom';
            // Only check for syntax
            const unCheckForGlobal = (syntaxOrUi === 'syntax') ? scope => scope !== 'global' : _ => true;
            // Colors
            if (syntaxOrUi === 'syntax' && !theme[syntaxOrUi].colors.hasOwnProperty('global')) {
                return [false, baseMsg + 'has no "global" color'];
            }
            if (!theme[syntaxOrUi].hasOwnProperty('colors')) {
                return [false, baseMsg + 'has no "colors" key'];
            }

            for (const scope of Object.keys(theme[syntaxOrUi].colors)) {
                if (!theme[syntaxOrUi].colors[scope].isValid()) {
                    return [false, baseMsg + 'has one or more invalid color hexs'];
                }
                if (inheritanceKeys.indexOf(scope) !== -1) {
                    return [false, baseMsg + 'assigns a color to a ' + bottomLevel + '-level scope'];
                }
                if (unCheckForGlobal(scope) && scopeKeys.indexOf(scope) === -1) {
                    return [false, baseMsg + 'assigns a color to a non existent scope'];
                }
            }
            // Inheritance
            if (theme[syntaxOrUi].hasOwnProperty('inheritance')) {
                for (const scope of Object.keys(theme[syntaxOrUi].inheritance)) {
                    if (inheritanceKeys.indexOf(scope) === -1) {
                        return [false,
                            baseMsg + 'assigns inheritance to a non ' + bottomLevel + '-level scope'];
                    }
                    const inheritFrom = theme[syntaxOrUi].inheritance[scope];
                    if (inheritanceKeys.indexOf(inheritFrom) !== -1) {
                        return [false,
                            baseMsg + 'assigns inheritance from a ' + bottomLevel + '-level scope'];
                    }
                    if (unCheckForGlobal(inheritFrom) && scopeKeys.indexOf(inheritFrom) === -1) {
                        return [false, baseMsg + 'assigns inheritance from a non existent scope'];
                    }
                }
            }
        }
        return [true, ''];
    }

    // Read and Parse JSON
    private readJson(file: string, base: string = this.themesDir) {
        return JSON.parse(fs.readFileSync(path.join(base, file), 'utf8'));
    }

}
