'use strict';
import * as vscode from 'vscode'; // VS Code extensibility API
import * as path from 'path';
import * as delay from 'timeout-as-promise';
import { InputBoxOptions } from 'vscode';
import { Data } from './data';
import { Builder } from './builder';
import { ThemeExport } from './export';

export class Controller {

    constructor (private data: Data, private builder: Builder, private themeExport: ThemeExport) {

    }

    public dispose() { }

    // Update on changed settings
    public updateOnChangedSettings(saved: vscode.TextDocument) {
        delay(2000) // Changes are not immediately applied, set a delay
        .then(() => {
            const fileName = path.basename(saved.fileName);
            if (fileName !== 'settings.json') return;

            const currentTheme = this.data.currentTheme;
            if (currentTheme === this.data.modeTheme('dark')
            || currentTheme === this.data.modeTheme('light')) {
                // Detect when theme was changed to Themelier but there was no explicit choice
                if (!this.data.choice.explicit) {
                    const msg = `You can now choose your Themelier theme`;
                    this.actionMsg(msg, 'Choose', this.choose, false);
                    return;
                }

                // Detect when current Themelier theme doesn't match last choice
                const lastMode = this.data.choice.forMode;
                if (currentTheme !== this.data.modeTheme(lastMode)) {
                    console.log(currentTheme, this.data.modeTheme(lastMode));
                    // tslint:disable-next-line:max-line-length
                    const msg = `Your current theme is ${ currentTheme } while your last chosen Themelier themes were for ${ this.data.modeName(lastMode) }`;
                    this.actionMsg(msg, 'Change', this.choose, false);
                    return;
                }
            }
            // Rebuild if Themelier settings have changed
            if (this.data.settingsChanged) this.build();
        });
    }

    // Building
    public build = async (reload: boolean = false, forExport: boolean = false): Promise<any> => {

        const choice = this.data.choice;

        // Ensure choice mode is the last chosen mode
        if (this.data.mode !== choice.forMode) {
            // tslint:disable-next-line:max-line-length
            const msg = `Your current mode ${ this.data.modeName() } while your last chosen Themelier UI was for ${ this.data.modeName(choice.forMode) }`;
            this.actionMsg(msg, 'Change', this.choose);
            return Promise.reject(msg);
        }

        // Ensure current choice was user defined - not automatically defined
        // Automatically triggers if previously chosen theme is not available
        if (!choice.explicit) {
            const msg = 'Select your Themelier syntax and UI themes first';
            this.actionMsg(msg, 'Select', this.choose);
            return Promise.reject(msg);
        }

        // Validate Theme
        const [isValid, msg] = this.data.themeValid;
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
                const reasonMsg = 'Themelier build failed' + ((reason) ? `: ${reason}` : '');
                vscode.window.showErrorMessage(reasonMsg);
                reject(reasonMsg);
            });
        });
    }

    // Choosing
    public choose = () => {
        /* tslint:disable:promise-function-async */
        new Promise((accept, reject) => {
            vscode.window.showQuickPick(['Dark', 'Light'])
            .then((mode) => {
                if (!mode) reject();
                else {
                    this.data.mode = mode;
                    accept();
                }
            });
        })
        .then(() => {
            return new Promise((accept, reject) => {
                const baseThemes = this.data.baseThemes;
                const syntaxKeys = Object.keys(baseThemes.syntax);
                const uiKeys = Object.keys(baseThemes.ui);
                if (syntaxKeys.length === 0 || uiKeys.length === 0) {
                    reject('There are no ' +  this.data.modeName() + ' syntax or UI themes');
                } else {
                    // Remember last pick as first in dropdown
                    const choice = this.data.choice;
                    if (choice.forMode === this.data.mode) {
                        const iSyntax = syntaxKeys.indexOf(choice.syntax);
                        const iUi = uiKeys.indexOf(choice.ui);
                        if (iSyntax !== -1) {
                            syntaxKeys.splice(iSyntax, 1);
                            syntaxKeys.unshift(choice.syntax);
                        }
                        if (iUi !== -1) {
                            uiKeys.splice(iUi, 1);
                            uiKeys.unshift(choice.ui);
                        }
                    }
                    accept([syntaxKeys, uiKeys]);
                }
            });
        })
        .then(([syntaxKeys, uiKeys]) => {
            return new Promise((accept, reject) => {
                vscode.window.showQuickPick(syntaxKeys)
                .then(syntaxSel => {
                    (!syntaxSel) ? reject() : accept([uiKeys, syntaxSel]);
                });
            });
        })
        .then(([uiKeys, syntaxSel]) => {
            return new Promise((accept, reject) => {
                vscode.window.showQuickPick(uiKeys.map(x => x + ' UI'))
                .then(uiSel => {
                    (!uiSel) ? reject() : accept([syntaxSel, uiSel.slice(0, -3)]);
                });
            });
        })
        .then(([syntaxSel, uiSel]) => {
            // Save Choice
            this.data.choice = {
                'syntax': syntaxSel,
                'ui': uiSel,
                'explicit': true
            };
            // Build
            return this.build();
        })
        .then(() => {
            // Change Theme to Themelier if build was successful
            this.data.currentTheme = this.data.modeTheme(this.data.choice.forMode);
        })
        .catch((err) => {
            if (err) vscode.window.showErrorMessage(err);
        });
        /* tslint:enable:promise-function-async */
    }

    public export = () => {
        /* tslint:disable:promise-function-async */
        new Promise((accept, reject) => {
            // Getting type of export
            const types = {
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
            });
        })
        .then((type) => {
            // Only Syntax?
            const forSyntaxAndUi = {
                    'Both Syntax & UI': 'all',
                    'Syntax & basic UI (background, highlight, selection, guide)': 'basic',
                    'Only Syntax': 'syntax'
                };
            const forSyntaxAndUiKeys = Object.keys(forSyntaxAndUi);
            return new Promise((accept, reject) => {
                if (type === 'tmtheme') forSyntaxAndUiKeys.splice(0,1);
                vscode.window.showQuickPick(forSyntaxAndUiKeys).then(onlySyntax => {
                    (!onlySyntax) ? reject() : accept([type, forSyntaxAndUi[onlySyntax]]);
                });
            });

        })
        .then(([type, onlySyntax]) => {
            // Theme Name
            return new Promise((accept, reject) => {
                vscode.window.showInputBox({'prompt': 'Name your Theme (optional)'})
                .then(name => {
                    if (!name) name = this.data.modeTheme() + ' derived';
                    accept([type, onlySyntax, name]);
                });
            });
        })
        .then(([type, onlySyntax, name]) => {
            // Theme Author
            return new Promise((accept, reject) => {
                if (type === 'json') accept([type, onlySyntax, name, '']);
                else vscode.window.showInputBox({'prompt': 'Author / Publisher (optional)'})
                    .then(author => {
                        if (!author) author = 'Themelier';
                        accept([type, onlySyntax, name, author]);
                    });
            });
        })
        .then(([type, onlySyntax, name, author]) => {
            // Theme description - for extensions
            return new Promise((accept, reject) => {
                if (type !== 'extension') {
                    accept([type, onlySyntax, name, author, '']);
                } else vscode.window.showInputBox({'prompt': 'Description (optional)'})
                .then(description => {
                    if (!description) description = `A ${ this.data.modeName() } theme created with Themelier`;
                    accept([type, onlySyntax, name, author, description]);
                });
            });
        })
        .then(([type, onlySyntax, name, author, description]) => {
            // Rebuild theme
            return new Promise((accept, reject) => {
                this.build(false, true)
                .then(() => {
                    accept([type, onlySyntax, name, author, description]);
                })
                /* tslint:disable-next-line:max-line-length */
                .catch((_) => reject('Themelier couldn\'t export as the rebuilding of your theme failed. Retry after you solve the issue.'));
            });
        })
        .then(([type, onlySyntax, name, author, description]) => {
            // Run
            this.themeExport.export(type, onlySyntax, name, author, description);
        })
        .catch((reason) => {
            if (reason) vscode.window.showErrorMessage(reason);
        });
        /* tslint:enable:promise-function-async */
    }

    // Interaction
    private reloadWindow() {
        vscode.commands.executeCommand('workbench.action.reloadWindow');
    }

    private actionMsg = (msg: string, btn: string, fn: () => any, error: boolean = true) => {
        ((error) ?
            vscode.window.showErrorMessage(msg, { 'title': btn }) :
            vscode.window.showInformationMessage(msg, { 'title': btn })
        ).then((item) => {
            if (!item) return;
            fn();
        });
    }

}
