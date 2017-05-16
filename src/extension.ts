'use strict';
import * as vscode from 'vscode'; // VS Code extensibility API

// This method is called when the extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)

    console.log('Themelier is now active!');
    let fs = require('fs'),
        path = require('path'),
        themingDir = path.join(__dirname, '../../theming'),
        rules = fs.readFileSync(path.join(themingDir, 'rules.json'), 'utf8'),
        syntax = fs.readFileSync(path.join(themingDir, 'syntax.json'), 'utf8'),
        ui = fs.readFileSync(path.join(themingDir, 'ui.json'), 'utf8');

    // The command has been defined in package.json (names )must match)
    let disposable = vscode.commands.registerCommand('extension.reload', () => {
        // This will be executed every time the command is executed
        
        console.log(rules);
        vscode.window.showInformationMessage('Themelier has been reloaded.');
    });

    context.subscriptions.push(disposable);
}

// Method called when the extension is deactivated
export function deactivate() {
}