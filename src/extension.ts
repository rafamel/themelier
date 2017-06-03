'use strict';
import * as vscode from 'vscode'; // VS Code extensibility API
import { Data } from './data';
import { Builder } from './builder';
import { ThemeExport } from './export';
import { Controller } from './controller';

// This method is called when the extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    let data = new Data(context),
        builder = new Builder(data),
        themeExport = new ThemeExport(data),
        controller = new Controller(data, builder, themeExport);

    if (data.isFirst) { // Do first build and offer theme choice at first install
        data.setFirst(false);
        data.setVer();
        builder.fullBuild();
        vscode.window.showInformationMessage('Themelier is active', { title: 'Choose a theme' }).then(function (item) {
            if (!item) return;
            controller.choose();
        });
    } else if (data.currentVer !== data.savedVer) { // Do full build and reload on updates
        data.setVer();
        // Silent full build
        builder.fullBuild();
        // If it's the current theme, rebuild the chosen theme with the controller assurances, and automatic reload
        if (data.isCurrent()) controller.build(true);
    }

    // Register Commands
    let rebuildCommand = vscode.commands.registerCommand('themelier.rebuild', () => {
        controller.build();
    });

    let chooseCommand = vscode.commands.registerCommand('themelier.choose', () => {
        controller.choose();
    });

    let exportCommand = vscode.commands.registerCommand('themelier.export', () => {
        controller.export();
    });

    // Add to a list of disposables which are disposed when this extension is deactivated.
    context.subscriptions.push(data, builder, controller, rebuildCommand, chooseCommand, exportCommand);

}

// Method called when the extension is deactivated
export function deactivate(context: vscode.ExtensionContext) {
    let data = new Data(context);
    data.setFirst(true);
    data.setVer('');
    data.setCurrent('', []);
}
