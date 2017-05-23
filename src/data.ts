'use strict';
import * as vscode from 'vscode'; // VS Code extensibility API

let fs = require('fs'),
    path = require('path');

export class Data {

    private baseDir: string;
    private themingDir: string;
    private _scopes: {};
    private _inheritance: {};
    private _syntax: {};
    private _ui: {};
    private _commonStyles: Object[];

    constructor(private context: vscode.ExtensionContext) {
        this.baseDir = path.join(__dirname, '../../');
        this.themingDir = path.join(this.baseDir, 'theming');
    }

    // Read and Parse JSON
    private readJson(file: string, base: string = this.themingDir) { 
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

    // Reading user settings w/ specific theme files
    
    private userSettings(): {'syntax': {}, 'ui': {}} {
        let worspaceConfig = vscode.workspace.getConfiguration('themelier'),
            config = {'syntax': {}, 'ui': {}},
            scopesKeys = Object.keys(this.scopes);
        for (let item in worspaceConfig) {
            if (worspaceConfig[item]) {
                if (scopesKeys.indexOf(item) !== -1) config['syntax'][item] = worspaceConfig[item];
                else config['ui'][item] = worspaceConfig[item];
            }
        }
        return config;
    }

    public themeSyntaxUi(syntaxUiPick: string[] = this.savedPick, mode: string = this.savedMode, applyUserSettings: boolean = true): {'syntax': {}, 'ui': {}} {
        let syntaxPath = path.join('syntax', this.syntax[mode][syntaxUiPick[0]]),
            uiPath = path.join('ui', this.ui[mode][syntaxUiPick[1]]),
            userSettings = this.userSettings(),
            theming = {
                'syntax': this.readJson(syntaxPath),
                'ui': this.readJson(uiPath)
            };
        if (applyUserSettings) {
            for (let syntaxOrUi in userSettings) {
                for (let item in userSettings[syntaxOrUi]) {
                    theming[syntaxOrUi][item] = userSettings[syntaxOrUi][item];
                }
            }
        }
        return theming;
    }

    // Common Styles
    public get commonStyles(): Object[] {
        if (!this._commonStyles) this._commonStyles = this.readJson('commonStyles.json');
        return this._commonStyles;
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

    // Writing theme files
    public writeTheme(name: string, theme: {}) {
        fs.writeFileSync(path.join(this.baseDir, 'dest', name + '.json'), JSON.stringify(theme, null, 2), 'utf8');
    }

    dispose() {
    }

}
