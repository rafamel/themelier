'use strict';
import * as vscode from 'vscode'; // VS Code extensibility API

let fs = require('fs'),
    path = require('path');

export class Data {

    private baseDir: string;
    private themesDir: string;
    private _scopes: {};
    private _inheritance: {};
    private _syntax: {};
    private _ui: {};
    private _themes: {'syntax': {}, 'ui': {}};

    constructor(private context: vscode.ExtensionContext) {
        this.baseDir = path.join(__dirname, '../../');
        this.themesDir = path.join(this.baseDir, 'themes');
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
                    themePath = path.join(syntaxAndUi[i], syntaxOrUiObj[mode][syntaxUiPick[i]]);
                this._themes[syntaxAndUi[i]][syntaxUiPick[i]] = this.readJson(themePath);
            }
        }
        return {'syntax': this._themes['syntax'][syntaxUiPick[0]], 'ui': this._themes['ui'][syntaxUiPick[1]]};
    }

    // Validate themes
    public validThemes(syntaxUiPick: string[], mode: string): [boolean, string] {
        let themes = this.getThemes(syntaxUiPick, mode),
            inheritanceKeys = Object.keys(this.inheritance),
            syntaxScopesKeys = Object.keys(this.scopes['syntax']),
            baseMsg = 'The chosen syntax theme ';

        // Colors
        if (!themes['syntax'].hasOwnProperty('colors')) return [false, baseMsg + 'has no "colors" key'];
        if (!themes['syntax']['colors'].hasOwnProperty('global')) return [false, baseMsg + 'has no "global" color'];
        for (let scope in themes['syntax']['colors']) {
            if (inheritanceKeys.indexOf(scope) !== -1) return [false, baseMsg + 'assigns a color to a third-level scope'];
            if (scope !== 'global' && syntaxScopesKeys.indexOf(scope) === -1) return [false, baseMsg + 'assigns a color to a non existent scope'];
        }
        
        // Inheritance
        if (themes['syntax'].hasOwnProperty('inheritance')) {
            for (let scope in themes['syntax']['inheritance']) {
                if (inheritanceKeys.indexOf(scope) === -1) return [false, baseMsg + 'assigns inheritance to a non third-level scope'];
                let inheritFrom = themes['syntax']['inheritance'][scope];
                if (inheritanceKeys.indexOf(inheritFrom) !== -1) return [false, baseMsg + 'assigns inheritance from a third-level scope'];
                if (inheritFrom !== 'global' && syntaxScopesKeys.indexOf(inheritFrom) === -1) return [false, baseMsg + 'assigns inheritance from a non existent scope'];
            }
        }

        return [true, ''];
    }

    // User Settings
    private userSetSyntaxUi(): {'syntax': {}, 'ui': {}} {
        const validColor = (color) => color.match(/^#[0-9a-f]{3,8}$/i) && (color.length === 4 || color.length === 7 || color.length === 9);
        let worspaceConfig = vscode.workspace.getConfiguration('themelier'),
            config = {'syntax': {}, 'ui': {}};

        for (let syntaxOrUi in config) {
            if (worspaceConfig.hasOwnProperty(syntaxOrUi)) {
                for (let item in worspaceConfig[syntaxOrUi]) {
                    let color = worspaceConfig[syntaxOrUi][item];
                    if (validColor(color) && this.scopes[syntaxOrUi].hasOwnProperty(item)) {
                        config[syntaxOrUi][item] = worspaceConfig[syntaxOrUi][item];
                    }
                }
            }
        }
        return config;
    }

    // Reading user settings w/ specific theme files
    public themeSyntaxUi(syntaxUiPick: string[] = this.savedPick, mode: string = this.savedMode, applyUserSettings: boolean = true): {'syntax': {}, 'ui': {}, 'inheritance': {}} {
        let {syntax, ui} = this.getThemes(syntaxUiPick, mode),
            theming = {'syntax': syntax["colors"], 'ui': ui, 'inheritance': this.inheritance};
        
        // Inheritance
        if (syntax.hasOwnProperty('inheritance')) {
            theming['inheritance'] = JSON.parse(JSON.stringify(theming['inheritance'])); // Make object copy
            for (let scope in syntax['inheritance']) {
                theming['inheritance'][scope] = syntax['inheritance'][scope];
            }
        }

        // Syntax and UI User Settings
        if (applyUserSettings) {
            let userSettings = this.userSetSyntaxUi();
            for (let syntaxOrUi of ['syntax', 'ui']) {
                if (userSettings.hasOwnProperty(syntaxOrUi)) {
                    for (let item in userSettings[syntaxOrUi]) {
                        theming[syntaxOrUi][item] = userSettings[syntaxOrUi][item];
                    }
                }
            }
        }

        return theming;
    }

    // Scopes
    public get scopes(): Object {
        if (!this._scopes) this._scopes = this.readJson('scopes.json');
        return this._scopes;
    }

    // Inheritance
    public get inheritance(): Object {
        if (!this._inheritance) {
            let readInheritance = this.readJson('inheritance.json'),
                inheritance = {};
            for (let item in readInheritance) {
                readInheritance[item].forEach(x => { inheritance[x] = item; });
            }
            this._inheritance = inheritance;
        }

        return this._inheritance;
    }

    // public themeInheritance(): Object {
    //     let inheritance = this.inheritance;

    // }

    // Writing theme file
    public writeTheme(name: string, theme: {}) {
        fs.writeFileSync(path.join(this.baseDir, 'dest', name + '.json'), JSON.stringify(theme, null, 2), 'utf8');
    }

    dispose() {
    }

}
