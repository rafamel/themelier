'use strict';
import * as vscode from 'vscode'; // VS Code extensibility API
import { InputBoxOptions } from 'vscode';
import { Data } from './data';
import { Builder } from './builder';
import { ThemeExport } from './export';

export class Controller {

    constructor(private data: Data, private builder: Builder, private themeExport: ThemeExport) {

    }

    // Interaction
    private actionMsg = (msg: string, btn: string, fn: Function, error: Boolean = true) => {
        ((error) ? vscode.window.showErrorMessage(msg, { title: btn }) : vscode.window.showInformationMessage(msg, { title: btn }))
        .then(function (item) {
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
            savedMode = this.data.savedMode,
            savedPick = this.data.savedPick,
            syntaxKeys = this.data.syntaxKeys(currentMode),
            uiKeys = this.data.uiKeys(currentMode);

        if (syntaxKeys.length === 0 || uiKeys.length === 0) {
            vscode.window.showInformationMessage('There are no ' + this.data.currentTheme + ' syntax or UI themes');
            return;
        }

        if (currentMode === savedMode && savedPick.length) { // Remember last pick as first in dropdown
            let iSyntax = syntaxKeys.indexOf(savedPick[0]),
                iUi = uiKeys.indexOf(savedPick[1]);
            if (iSyntax !== -1) {
                syntaxKeys.splice(iSyntax, 1);
                syntaxKeys.unshift(savedPick[0]);
            }
            if (iUi !== -1) {
                uiKeys.splice(iUi, 1);
                uiKeys.unshift(savedPick[1]);
            }
        }

        vscode.window.showQuickPick(syntaxKeys).then(syntaxSel => {
            if (!syntaxSel) return;
            vscode.window.showQuickPick(uiKeys.map(x => x + ' UI')).then(uiSel => {
                if (!uiSel) return;
                // Save Pick & Mode
                this.data.setCurrent(currentMode, [syntaxSel, uiSel.slice(0, -3)]);
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

        // Check both chosen Syntax and UI themes still exist
        let syntaxKeys = this.data.syntaxKeys(savedMode),
            uiKeys = this.data.uiKeys(savedMode);
        if (syntaxKeys.indexOf(savedPick[0]) === -1 || uiKeys.indexOf(savedPick[1]) === -1) {
            this.actionMsg('Your chosen Themelier theme for syntax or UI is not available', 'Change', this.choose);
            return;
        }

        // Validate Theme
        let [isValid, msg] = this.data.validThemes(savedPick, savedMode);
        if (!isValid) {
            this.actionMsg(msg, 'Change', this.choose);
            return;
        }

        this.builder.build();

        if (reload) vscode.commands.executeCommand('workbench.action.reloadWindow');
        else this.actionMsg('Themelier has built the theme based on your settings', 'Reload', this.reloadWindow, false);
    }


    public export = () => {

        // REFACTOR: To Promise style

        // Options
        let options = {
            'Create VSCode Theme': 'extension',
            'Export as VSCode JSON theme file': 'json',
            'Export Syntax theme as universal tmTheme': 'tmtheme'
        };
        let psOption = vscode.window.showQuickPick(Object.keys(options)).then(option => {
            if (!option) return;
            option = options[option];

            // Check empty folder
            let psCont: Thenable<Boolean> = Promise.resolve(true);
            if (option === 'extension') {
                psCont = vscode.workspace.findFiles('**').then(x => { // TODO Exclude system files but not .git
                    if (x.length) {
                        vscode.window.showErrorMessage('Your root folder must be empty. Create a new folder and open it before retrying.');
                        return false;
                    } else return true;
                });
            }
            psCont.then(cont => {
                if (!cont) return;

                // Only Syntax?
                let forSyntaxAndUi = {
                        'Both Syntax and UI': 'all',
                        'Syntax and basic UI (background, highlight, selection, guide)': 'basic',
                        'Only Syntax': 'syntax'
                    },
                    forSyntaxAndUiKeys = Object.keys(forSyntaxAndUi);
                if (option === 'tmtheme') forSyntaxAndUiKeys.splice(0,1);

                vscode.window.showQuickPick(forSyntaxAndUiKeys).then(onlySyntax => {
                    if (!onlySyntax) return;
                    onlySyntax = forSyntaxAndUi[onlySyntax];

                    // Mode
                    let mode = ((this.data.isCurrent()) ? this.data.currentMode() : this.data.savedMode),
                        psMode: Thenable<string> = Promise.resolve(mode);
                    if (!mode) {
                        psMode = vscode.window.showQuickPick(['Dark', 'Light']).then(x => {
                            if (!x) return;
                            return x.toLowerCase();
                        });
                    }
                    psMode.then(mode => {
                        if (!mode) return;

                        // Theme Name
                        vscode.window.showInputBox({prompt: "Name your Theme (optional)"}).then(name => {
                            if (!name) name = 'Themelier ' + mode.charAt(0).toUpperCase() + mode.slice(1) + ' derived';

                            // Theme Author
                            let psAuthor: Thenable<string> = Promise.resolve('Themelier');
                            if (option !== 'json') {
                                psAuthor = vscode.window.showInputBox({prompt: "Author / Publisher (optional)"}).then(author => {
                                    if (!author) author = 'Themelier';
                                    return author;
                                });
                            }
                            psAuthor.then(author => {

                                // Run
                                this.themeExport.export(option, onlySyntax, mode, name, author);
                            });
                        })
                    });
                });
            })
        });
    }

    dispose() {
    }
}
