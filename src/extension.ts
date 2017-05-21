'use strict';
import * as vscode from 'vscode'; // VS Code extensibility API
import { Data } from './data';
import { Controller } from './controller';
import { Builder } from './builder';

// This method is called when the extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error).
    // This line of code will only be executed once when your extension is activated.

    let data = new Data(context),
        builder = new Builder(data),
        controller = new Controller(data, builder);

    // Do full build on new install and updates
    if (data.isFirst || data.currentVer !== data.savedVer) {
        data.setVer();
        builder.firstBuild();
        // if (data.isCurrent()) vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
    // Offer theme choice at first install
    if (data.isFirst) {
        data.setFirst(false);
        vscode.window.showInformationMessage('Themelier is active', { title: 'Choose a theme' }).then(function (item) {
            if (!item) return;
            controller.choose();
        });
    }

    // Register Commands
    let rebuildCommand = vscode.commands.registerCommand('themelier.rebuild', () => {
        controller.build();
    });

    let chooseCommand = vscode.commands.registerCommand('themelier.choose', () => {
        controller.choose();
    });
    
    // Add to a list of disposables which are disposed when this extension is deactivated.
    context.subscriptions.push(data, builder, controller, rebuildCommand, chooseCommand);

}

// Method called when the extension is deactivated
export function deactivate(context: vscode.ExtensionContext) {
    let data = new Data(context);
    data.setFirst(true);
    data.setVer('');
}
