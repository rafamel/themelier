'use strict';
import * as vscode from 'vscode'; // VS Code extensibility API

let fs = require('fs'),
    path = require('path');

export class Data {

    private baseDir: string;
    private themingDir: string;
    private _scopes: {};
    private _inheritance: {};
    public _syntax: {};
    public _ui: {};

    constructor(private context: vscode.ExtensionContext) {
        this.baseDir = path.join(__dirname, '../../');
        this.themingDir = path.join(this.baseDir, 'theming');
    }

    // General
    private readJson(file) { 
        return JSON.parse(fs.readFileSync(path.join(this.themingDir, file), 'utf8'));
    }
    
    private flatten(obj): Object {
        let newObj = {}
         Object.keys(obj).forEach(x => {
            Object.keys(obj[x]).forEach(y => {
                newObj[y] = obj[x][y];
            })
        });
        return newObj;
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
        let mode = 'dark';
        if (this.currentTheme === 'Themelier Light') mode = 'light';
        return mode;
    }

    public get savedMode(): string {
        let mode = this.context.globalState.get('thlMode');
        return (mode) ? mode[0] : '';
    }

    public get savedPick(): string[] {
        let pick = this.context.globalState.get('thlPick');
        return (pick) ? [pick[0], pick[1]] : [];
    }

    public setCurrent(mode, syntax, ui) {
        this.context.globalState.update('thlMode', [mode]);
        this.context.globalState.update('thlPick', [syntax, ui]);
    }

    // Reading specific theme files
    public syntaxUiForPick() {
        let savedPick = this.savedPick,
            syntaxPath = path.join('syntax', this.flatten(this.syntax)[savedPick[0]]),
            uiPath = path.join('ui', this.flatten(this.ui)[savedPick[1]]);
        return {
            "syntax": this.readJson(syntaxPath),
            "ui": this.readJson(uiPath)
        };
    }

    // Scopes
    public get scopes(): Object {
        if (!this._scopes) this._scopes = this.readJson('scopes.json');
        return this._scopes;
    }

    public get scopesKeys(): string[] {
        return Object.keys(this.scopes);
    }

    // Inheritance
    public get inheritance(): Object {
        if (!this._inheritance) this._inheritance = this.readJson('inheritance.json');
        return this._inheritance;
    }

    public get inheritanceKeys(): string[] {
        return Object.keys(this.inheritance);
    }

    // Writing theme files
    // TO-DO

    dispose() {
    }

}
