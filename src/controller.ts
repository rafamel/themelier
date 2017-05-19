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

    private waitToFn = (i: number, fn: Function) => {
        if (i >= 10) { // ~10 seconds are up!
            this.actionMsg('Themelier failed to detect your choice.', 'Retry', fn);
        } else { // Continue to wait
            let _this = this;
            setTimeout(function(){
                if (_this.data.isCurrent()) fn();
                else _this.waitToFn(i+1, fn);
            }, 1000);
        }
    }

    private reloadWindow() { vscode.commands.executeCommand('workbench.action.reloadWindow'); }
    private selectAndWaitToChoose = () =>  { 
        vscode.commands.executeCommand('workbench.action.selectTheme'); this.waitToFn(0, this.choose); 
    }
    private selectAndWaitToBuild = () => {
        vscode.commands.executeCommand('workbench.action.selectTheme'); this.waitToFn(0, this.build); 
    }

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
                this.data.setCurrent(currentMode, syntaxSel, uiSel);
                // Build
                this.build();
            });
        });
    }

    // Building
    public build = () => {
        
        // Check Themelier is active
        if (!this.data.isCurrent()) {
            this.actionMsg('Your current theme is not Themelier Light or Themelier Dark. Please change it first.', 'Change', this.selectAndWaitToBuild);
            return;
        }

        // Ensure there is some pick of Syntax and UI themes
        if (!this.data.savedPick.length) {
            this.actionMsg('You haven\'t chosen your Themelier syntax and UI themes.', 'Choose', this.choose);
            return;
        }

        // As there was a previous pick saved, ensure its mode is the same as the current themelier Theme
        let savedMode = this.data.savedMode;
        if (savedMode !== this.data.currentMode()) {
            this.actionMsg('Your current theme is ' + this.data.currentTheme + ' while your last chosen Themelier UI was for ' + savedMode.charAt(0).toUpperCase() + savedMode.slice(1), 'Change', this.choose);
            return;
        }
        
        this.builder.build();
        this.actionMsg('Themelier has built the theme based on your settings.', 'Restart', this.reloadWindow);
    }

    dispose() {
    }
}
