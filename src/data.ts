'use strict';
import * as vscode from 'vscode'; // VS Code extensibility API

const fs = require('fs-extra'),
    path = require('path');

export class Data {

    private baseDir: string;
    private themesDir: string;
    private _scopes: {'syntax': {}, 'ui': {}};
    private _inheritance: {'syntax': {}, 'ui': {}};
    private _syntax: {'dark': {}, 'light': {}};
    private _ui: {'dark': {}, 'light': {}};
    private _themes: {'syntax': {}, 'ui': {}};

    constructor(private context: vscode.ExtensionContext) {
        this.baseDir = path.join(__dirname, '../../');
        this.themesDir = path.join(this.baseDir, 'themes');
    }

    // FSError
    public fsError(err: Object, type: String, file: String): String {
        return type + ` error (${file}). ` + String(err).replace('Error:','');
    }

    // Empty directory? - Excludes system and git files
    public emptyDir(dir = vscode.workspace.rootPath): Boolean {
        let files = fs.readdirSync(dir),
            ignore = ['.DS_Store', '.DS_Store?', '.Trashes', '.gitignore', '.git',
                        'ehthumbs.db', 'Thumbs.db'];
        return files.filter(x => ignore.indexOf(x) === -1).length === 0;
    }

    // Read and Parse JSON
    private readJson(file: string, base: string = this.themesDir) {
        return JSON.parse(fs.readFileSync(path.join(base, file), 'utf8'));
    }

    // Syntax and UI Main files
    private get syntax(): Object {
        if (!this._syntax) this._syntax = this.readJson('syntax.json');
        return this._syntax;
    }

    private get ui(): Object {
        if (!this._ui) this._ui = this.readJson('ui.json');
        return this._ui;
    }

    public syntaxKeys(mode: string): string[] {
        return (this.syntax.hasOwnProperty(mode)) ? Object.keys(this.syntax[mode]) : [];
    }

    public uiKeys(mode: string): string[] {
        return (this.ui.hasOwnProperty(mode)) ? Object.keys(this.ui[mode]) : [];
    }

    // Current Theme & State
    public get currentTheme(): string {
        return vscode.workspace.getConfiguration('workbench')['colorTheme'];
    }

    public isCurrent(): boolean {
        let currentTheme = this.currentTheme;
        return (currentTheme === 'Themelier Dark' || currentTheme === 'Themelier Light');
    }

    public modeName(mode = this.savedMode) {
        return mode.charAt(0).toUpperCase() + mode.slice(1);
    }

    public currentMode(): string {
        let mode = '';
        if (this.currentTheme === 'Themelier Dark') mode = 'dark';
        else if (this.currentTheme === 'Themelier Light') mode = 'light';
        return mode;
    }

    public get savedMode(): string {
        let mode = this.context.globalState.get('thlMode');
        return (mode) ? mode[0] : '';
    }

    public get savedPick(): string[] {
        let pick = this.context.globalState.get('thlPick');
        return (pick && pick[0] && pick[1]) ? [pick[0], pick[1]] : [];
    }

    public setCurrent(mode: string, syntaxUi: string[]) {
        this.context.globalState.update('thlMode', [mode]);
        this.context.globalState.update('thlPick', syntaxUi);
    }

    public get currentVer(): string {
        return this.readJson('package.json', this.baseDir)['version'];
    }

    public get savedVer(): string {
        let ver = this.context.globalState.get('thlVer');
        return (ver) ? ver[0] : '';
    }

    public setVer(s: string = this.currentVer) {
        this.context.globalState.update('thlVer', [s]);
    }

    public get isFirst() {
        let first = this.context.globalState.get('thlFirst');
        return (first) ? (!first) : true;
    }

    public setFirst(val: boolean) {
        this.context.globalState.update('thlFirst', (!val));
    }

    // Syntax and UI themes
    private getThemes(syntaxUiPick: string[], mode: string): {'syntax': {}, 'ui': {}} {
        if (!this._themes) this._themes = {'syntax': {}, 'ui': {}};

        let syntaxAndUi = ['syntax', 'ui'];
        for (let i in syntaxAndUi) {
            if (!this._themes[syntaxAndUi[i]].hasOwnProperty(syntaxUiPick[i])) {
                let syntaxOrUiObj = (syntaxAndUi[i] === 'syntax') ? this.syntax : this.ui,
                    themePath = path.join(syntaxAndUi[i], mode,
                                            syntaxOrUiObj[mode][syntaxUiPick[i]]);
                this._themes[syntaxAndUi[i]][syntaxUiPick[i]] = this.readJson(themePath);
            }
        }
        return {'syntax': this._themes['syntax'][syntaxUiPick[0]],
                    'ui': this._themes['ui'][syntaxUiPick[1]]};
    }

    // Validate themes
    public validThemes(syntaxUiPick: string[], mode: string): [boolean, string] {
        let themes = this.getThemes(syntaxUiPick, mode),
            syntaxAndUi = ['syntax', 'ui'];

        for (let syntaxOrUi of syntaxAndUi) {
            let inheritanceKeys = Object.keys(this.inheritance[syntaxOrUi]),
                scopeKeys = Object.keys(this.scopes[syntaxOrUi]),
                baseMsg = 'The chosen ' + syntaxOrUi + ' theme ',
                bottomLevel = (syntaxOrUi === 'syntax') ? 'third' : 'bottom',
                unCheckForGlobal = (syntaxOrUi === 'syntax') ? // Only check for syntax
                                        scope => scope !== 'global' : _ => true;

            // Colors
            if (syntaxOrUi === 'syntax' && !themes[syntaxOrUi]['colors'].hasOwnProperty('global')) {
                return [false, baseMsg + 'has no "global" color'];
            }
            if (!themes[syntaxOrUi].hasOwnProperty('colors')) {
                return [false, baseMsg + 'has no "colors" key'];
            }
            for (let scope in themes[syntaxOrUi]['colors']) {
                if (inheritanceKeys.indexOf(scope) !== -1) {
                    return [false,
                        baseMsg + 'assigns a color to a ' + bottomLevel + '-level scope'];
                }
                if (unCheckForGlobal(scope) && scopeKeys.indexOf(scope) === -1) {
                    return [false, baseMsg + 'assigns a color to a non existent scope'];
                }
            }

            // Inheritance
            if (themes[syntaxOrUi].hasOwnProperty('inheritance')) {
                for (let scope in themes[syntaxOrUi]['inheritance']) {
                    if (inheritanceKeys.indexOf(scope) === -1) {
                        return [false,
                            baseMsg + 'assigns inheritance to a non ' + bottomLevel + '-level scope'];
                    }
                    let inheritFrom = themes[syntaxOrUi]['inheritance'][scope];
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

    // User Settings
    private userSetSyntaxUi(): {'syntax': {}, 'ui': {}} {
        const validColor = (color) => {
            return (color.match(/^#[0-9a-f]{3,8}$/i) &&
                (color.length === 4 || color.length === 7 || color.length === 9));
        }

        let worspaceConfig = vscode.workspace.getConfiguration('themelier'),
            config = {'syntax': {}, 'ui': {}};

        ['syntax', 'ui'].forEach(syntaxOrUi => {
            if (worspaceConfig.hasOwnProperty(syntaxOrUi)) {
                for (let item in worspaceConfig[syntaxOrUi]) {
                    let color = worspaceConfig[syntaxOrUi][item];
                    if (validColor(color) && this.scopes[syntaxOrUi].hasOwnProperty(item)) {
                        config[syntaxOrUi][item] = worspaceConfig[syntaxOrUi][item];
                    }
                }
            }
        });
        return config;
    }

    // Reading user settings w/ specific theme files
    public themeSyntaxUi(
            syntaxUiPick: string[] = this.savedPick,
            mode: string = this.savedMode,
            applyUserSettings: boolean = true
        ): {
            'syntax': {'colors': {}, 'inheritance': {}},
            'ui': { 'colors': {}, 'inheritance': {}}
        }
    {
        let themes = this.getThemes(syntaxUiPick, mode),
            inheritance =  JSON.parse(JSON.stringify(this.inheritance)), // Make object copy
            theming = {
                'syntax': {
                    'colors': themes['syntax']['colors'],
                    'inheritance': inheritance['syntax']
                }, 'ui': {
                    'colors': themes['ui']['colors'],
                    'inheritance': inheritance['ui']
                }
            };

        // Inheritance
        ['syntax', 'ui'].forEach(syntaxOrUi => {
            if (themes[syntaxOrUi].hasOwnProperty('inheritance')) {
                for (let scope in themes[syntaxOrUi]['inheritance']) {
                    theming[syntaxOrUi]['inheritance'][scope] = themes[syntaxOrUi]['inheritance'][scope];
                }
            }
        });

        // Syntax and UI User Settings (colors)
        if (applyUserSettings) {
            let userSettings = this.userSetSyntaxUi();
            ['syntax', 'ui'].forEach(syntaxOrUi => {
                if (userSettings.hasOwnProperty(syntaxOrUi)) {
                    for (let item in userSettings[syntaxOrUi]) {
                        theming[syntaxOrUi]['colors'][item] = userSettings[syntaxOrUi][item];
                    }
                }
            });
        }

        return theming;
    }

    // Scopes
    public get scopes(): Object {
        if (!this._scopes) this._scopes = this.readJson('scopes.json');
        return this._scopes;
    }

    // Inheritance
    public get inheritance(): {'syntax': {}, 'ui': {}} {
        if (!this._inheritance) {
            let readInheritance = this.readJson('inheritance.json');
            this._inheritance = {'syntax': {}, 'ui': {}};
            for (let syntaxOrUi in readInheritance) {
                for (let item in readInheritance[syntaxOrUi]) {
                    readInheritance[syntaxOrUi][item]
                        .forEach(x => { this._inheritance[syntaxOrUi][x] = item; });
                }
            }
        }

        return this._inheritance;
    }

    // Writing final theme file
    public writeTheme(name: string, theme: {}, dir = path.join(this.baseDir, 'dest')): Promise<any> {
        return new Promise((accept, reject) => {
            fs.writeFile(path.join(dir, name + '.json'),
                            JSON.stringify(theme, null, 2), 'utf8')
            .then((index) => accept())
            .catch((err) => reject(this.fsError(err, 'Write', name)));
        });
    }

    // Get final theme file for export
    public getTheme(name: string): Object {
        return this.readJson(name + '.json', path.join(this.baseDir, 'dest'));
    }

    dispose() {
    }

}
