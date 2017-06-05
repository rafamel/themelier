'use strict';
import * as vscode from 'vscode'; // VS Code extensibility API
import { InputBoxOptions } from 'vscode';
import { Data } from './data';
import { Builder } from './builder';
import { ThemeExport } from './export';

export class Controller {

    constructor(private data: Data, private builder: Builder,
                private themeExport: ThemeExport) {

    }

    // Interaction
    private actionMsg = (msg: string, btn: string, fn: Function,
                        error: Boolean = true) => {
        ((error) ?
            vscode.window.showErrorMessage(msg, { title: btn }) :
            vscode.window.showInformationMessage(msg, { title: btn })
        ).then(function (item) {
            if (!item) return;
            fn();
        });
    }

    private waitToFn = (fn: Function, i: number = 0) => {
        if (i >= 20) { // ~10 seconds are up!
            this.actionMsg(
                'Themelier failed to detect your choice.',
                'Retry', fn
            );
        } else { // Continue to wait
            let _this = this;
            setTimeout(function(){
                if (_this.data.isCurrent()) fn();
                else _this.waitToFn(fn, i+1);
            }, 500);
        }
    }

    private reloadWindow() {
        vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
    private selectAndWaitToChoose = () =>  {
        vscode.commands.executeCommand('workbench.action.selectTheme');
        this.waitToFn(this.choose);
    }
    private selectAndWaitToBuild = () => {
        vscode.commands.executeCommand('workbench.action.selectTheme');
        this.waitToFn(this.build);
    }

    // Choosing
    public choose = () => {
        if (!this.data.isCurrent()) {
            // Current theme is not Themelier
            this.actionMsg(
                'Your current theme is not Themelier Light or Themelier Dark. Please change it first.',
                'Change', this.selectAndWaitToChoose
            );
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
            let msg = 'There are no ' +  this.data.currentTheme + ' syntax or UI themes';
            vscode.window.showInformationMessage(msg);
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

        vscode.window.showQuickPick(syntaxKeys)
        .then(syntaxSel => {
            if (!syntaxSel) return;
            vscode.window.showQuickPick(uiKeys.map(x => x + ' UI'))
            .then(uiSel => {
                if (!uiSel) return;
                // Save Pick & Mode
                this.data.setCurrent(currentMode,
                                    [syntaxSel, uiSel.slice(0, -3)]);
                // Build
                this.build();
            });
        });
    }

    // Building
    public build = (reload: Boolean = false, forExport: Boolean = false): Promise<any> => {

        // Ensure there is some pick of Syntax and UI themes
        let savedPick = this.data.savedPick;
        if (!savedPick.length) {
            let msg = 'You haven\'t chosen your Themelier syntax and UI themes';
            this.actionMsg(msg, 'Choose', this.choose);
            return Promise.reject(msg);
        }

        // As there was a previous pick saved, ensure its mode is the same as the current themelier Theme
        let currentMode = this.data.currentMode(),
            savedMode = this.data.savedMode;
        if (currentMode && savedMode !== currentMode) {
            let msg = `Your current theme is ${ this.data.currentTheme } while your last chosen Themelier UI was for ${ this.data.modeName(savedMode) }`;
            this.actionMsg(msg,'Change', this.choose);
            return Promise.reject(msg);
        }

        // Check both chosen Syntax and UI themes still exist
        let syntaxKeys = this.data.syntaxKeys(savedMode),
            uiKeys = this.data.uiKeys(savedMode);
        if (syntaxKeys.indexOf(savedPick[0]) === -1 ||
                uiKeys.indexOf(savedPick[1]) === -1) {
            let msg = 'Your chosen Themelier theme for syntax or UI is not available';
            this.actionMsg(msg, 'Change', this.choose);
            return Promise.reject(msg);
        }

        // Validate Theme
        let [isValid, msg] = this.data.validThemes(savedPick, savedMode);
        if (!isValid) {
            this.actionMsg(msg, 'Change', this.choose);
            return Promise.reject(msg);
        }

        return new Promise ((accept, reject) => {
            this.builder.build()
            .then(() => {
                if (reload) vscode.commands.executeCommand('workbench.action.reloadWindow');
                else if (!forExport) {
                    this.actionMsg(
                        'Themelier has built the theme based on your settings',
                        'Reload', this.reloadWindow, false
                    );
                }
                accept();
            })
            .catch((reason) => {
                let msg = 'Themelier build failed' + ((reason) ? `: ${reason}` : '');
                vscode.window.showErrorMessage(msg);
                reject(msg);
            });
        });

    }


    public export = () => {
        new Promise((accept, reject) => {
            // Getting type of export
            let types = {
                'Create VSCode Theme': 'extension',
                'Export as VSCode JSON theme file': 'json',
                'Export Syntax theme as universal tmTheme': 'tmtheme'
            };
            vscode.window.showQuickPick(Object.keys(types)).then(type => {
                if (!type) reject();
                else {
                    type = types[type];
                    if (type !== 'extension') accept(type);
                    else vscode.workspace.findFiles('**').then(x => {
                        // Check empty folder if type is extension
                        if (this.data.emptyDir()) accept(type);
                        else reject('Your root folder must be empty. Create a new folder and open it before retrying.');
                    });
                }
            })
        })
        .then((type) => {
            // Only Syntax?
            let forSyntaxAndUi = {
                    'Both Syntax & UI': 'all',
                    'Syntax & basic UI (background, highlight, selection, guide)': 'basic',
                    'Only Syntax': 'syntax'
                },
                forSyntaxAndUiKeys = Object.keys(forSyntaxAndUi);
            return new Promise((accept, reject) => {
                if (type === 'tmtheme') forSyntaxAndUiKeys.splice(0,1);
                vscode.window.showQuickPick(forSyntaxAndUiKeys).then(onlySyntax => {
                    if (!onlySyntax) reject();
                    else accept([type, forSyntaxAndUi[onlySyntax]]);
                });
            });

        })
        .then(([type, onlySyntax]) => {
            // Mode
            let mode = ((this.data.isCurrent()) ?
                            this.data.currentMode() : this.data.savedMode);

            return new Promise((accept, reject) => {
                if (mode) accept([type, onlySyntax, mode]);
                else vscode.window.showQuickPick(['Dark', 'Light']).then(x => {
                    if (!x) reject();
                    else accept([type, onlySyntax, x.toLowerCase()]);
                });
            });
        })
        .then(([type, onlySyntax, mode]) => {
            // Theme Name
            return new Promise((accept, reject) => {
                vscode.window.showInputBox({prompt: "Name your Theme (optional)"})
                .then(name => {
                    if (!name) name = `Themelier ${ this.data.modeName(mode) } derived`;
                    accept([type, onlySyntax, mode, name]);
                });
            });
        })
        .then(([type, onlySyntax, mode, name]) => {
            // Theme Author
            return new Promise((accept, reject) => {
                if (type === 'json') accept([type, onlySyntax, mode, name, '']);
                else vscode.window.showInputBox({prompt: "Author / Publisher (optional)"})
                    .then(author => {
                        if (!author) author = 'Themelier';
                        accept([type, onlySyntax, mode, name, author]);
                    });
            });
        })
        .then(([type, onlySyntax, mode, name, author]) => {
            // Theme description - for extensions
            return new Promise((accept, reject) => {
                if (type !== 'extension') {
                    accept([type, onlySyntax, mode, name, author, '']);
                } else vscode.window.showInputBox({prompt: "Description (optional)"})
                .then(description => {
                    if (!description) description = `A ${ this.data.modeName(mode) } theme created with Themelier`;
                    accept([type, onlySyntax, mode, name, author, description]);
                });
            });
        })
        .then(([type, onlySyntax, mode, name, author, description]) => {
            // Rebuild theme
            return new Promise((accept, reject) => {
                this.build(false, true)
                .then(() => {
                    accept([type, onlySyntax, mode, name, author, description]);
                })
                .catch((_) => reject('Themelier couldn\'t export as the rebuilding of your theme failed. Retry after you solve the issue.'));
            });
        })
        .then(([type, onlySyntax, mode, name, author, description]) => {
            // Run
            this.themeExport.export(type, onlySyntax, mode, name, author, description);
        })
        .catch((reason) => {
            if (reason) vscode.window.showErrorMessage(reason);
        });
    }

    dispose() {
    }
}
