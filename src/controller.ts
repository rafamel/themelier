'use strict';
import * as vscode from 'vscode'; // VS Code extensibility API
import { Builder } from './builder';
import { Data } from './data';

export class Controller {

    constructor(private data: Data, private builder: Builder) {

    }

    // Interaction
    private actionMsg = (msg: string, btn: string, fn: Function) => {
        vscode.window.showInformationMessage(msg, { title: btn }).then(function (item) {
            if (!item) return;
            fn();
        });
    }

    private waitToFn = (fn: Function, i: number = 0) => {
        if (i >= 20) { // ~10 seconds are up!
            this.actionMsg('Themelier failed to detect your choice.', 'Retry', fn);
        } else { // Continue to wait
            let _this = this;
            setTimeout(function(){
                if (_this.data.isCurrent()) fn();
                else _this.waitToFn(fn, i+1);
            }, 500);
        }
    }

    private reloadWindow() { vscode.commands.executeCommand('workbench.action.reloadWindow'); }
    private selectAndWaitToChoose = () =>  { 
        vscode.commands.executeCommand('workbench.action.selectTheme'); this.waitToFn(this.choose);
    }
    private selectAndWaitToBuild = () => {
        vscode.commands.executeCommand('workbench.action.selectTheme'); this.waitToFn(this.build);
    }

    // Choosing
    public choose = () => {
        if (!this.data.isCurrent()) {
            // Current theme is not Themelier
            this.actionMsg('Your current theme is not Themelier Light or Themelier Dark. Please change it first.', 'Change', this.selectAndWaitToChoose);
            return;
        }
        // Current theme IS Themelier
        // Save Current mode before requesting keys
        let currentMode = this.data.currentMode(),
            syntaxKeys = this.data.syntaxKeys(currentMode),
            uiKeys = this.data.uiKeys(currentMode);
        
        if (syntaxKeys.length === 0 || uiKeys.length === 0) {
            vscode.window.showInformationMessage('There are no ' + this.data.currentTheme + ' syntax or UI themes');
            return;
        }

        vscode.window.showQuickPick(syntaxKeys).then(syntaxSel => {
            if (!syntaxSel) return;
            vscode.window.showQuickPick(uiKeys).then(uiSel => {
                if (!uiSel) return;
                // Save Pick & Mode
                this.data.setCurrent(currentMode, [syntaxSel, uiSel]);
                // Build
                this.build();
            });
        });
    }

    // Building
    public build = (reload: boolean = false) => {

        // Ensure there is some pick of Syntax and UI themes
        let savedPick = this.data.savedPick;
        if (!savedPick.length) {
            this.actionMsg('You haven\'t chosen your Themelier syntax and UI themes', 'Choose', this.choose);
            return;
        }

        // As there was a previous pick saved, ensure its mode is the same as the current themelier Theme
        let currentMode = this.data.currentMode(),
            savedMode = this.data.savedMode;
        if (currentMode && savedMode !== currentMode) {
            this.actionMsg('Your current theme is ' + this.data.currentTheme + ' while your last chosen Themelier UI was for ' + savedMode.charAt(0).toUpperCase() + savedMode.slice(1), 'Change', this.choose);
            return;
        }

        let syntaxKeys = this.data.syntaxKeys(savedMode),
            uiKeys = this.data.uiKeys(savedMode);
        if (syntaxKeys.indexOf(savedPick[0]) === -1 || uiKeys.indexOf(savedPick[1]) === -1) {
            this.actionMsg('Your chosen Themelier theme for syntax or UI is not available', 'Change', this.choose);
        }
        
        this.builder.build();

        if (reload) vscode.commands.executeCommand('workbench.action.reloadWindow');
        else this.actionMsg('Themelier has built the theme based on your settings', 'Reload', this.reloadWindow);
    }

    dispose() {
    }
}
