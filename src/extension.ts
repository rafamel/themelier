'use strict';
import * as vscode from 'vscode'; // VS Code extensibility API

// This method is called when the extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)

    console.log('Themelier is now active!');

    const readJson = (file) => JSON.parse(fs.readFileSync(path.join(themingDir, file), 'utf8'));
    let fs = require('fs'),
        path = require('path'),
        themingDir = path.join(__dirname, '../../theming'),
        rules = readJson('rules.json'),
        syntax = readJson('syntax.json'),
        ui = readJson('ui.json');

    // Commands have been defined in package.json (names must match)
    // They'll be executed every time the command is executed
    vscode.commands.registerCommand('extension.reload', () => {
        vscode.window.showInformationMessage('Themelier has been reloaded.');
    });

    vscode.commands.registerCommand('extension.choose', () => {

        function showPick(syntaxSel, uiSel) {
            console.log(syntaxSel, uiSel);
        }

        let syntaxItems = Object.keys(syntax),
            uiItems = Object.keys(ui);
        vscode.window.showQuickPick(syntaxItems).then(syntaxSel => {
            if (!syntaxSel) return;
            vscode.window.showQuickPick(uiItems).then(uiSel => {
                if (!uiSel) return;
                showPick(syntaxSel, uiSel)
            });
        });
    });

}

// Method called when the extension is deactivated
export function deactivate() {
}