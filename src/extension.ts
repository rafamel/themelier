'use strict';
import * as vscode from 'vscode'; // VS Code extensibility API
import { Data } from './data';
import { Builder } from './builder';
import { ThemeExport } from './export';
import { Controller } from './controller';

// This method is called when the extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    const justUpdated = (): boolean => {
        return !(Object.keys(data.readTheme('light')).length && Object.keys(data.readTheme('dark')).length);
    };
    const firstEver = (): boolean => {
        return !data.choice.explicit;
    };

    const data = new Data(context);
    const builder = new Builder(data);
    const themeExport = new ThemeExport(data);
    const controller = new Controller(data, builder, themeExport);

    if (firstEver()) {
        // Do first build and offer theme choice at first install
        // (or automatically chosen theme due to other causes)
        console.log('First Ever Themelier Full Build');
        // Silent full build
        builder.fullBuild();
        vscode.window.showInformationMessage('Themelier is active', { 'title': 'Choose a theme' })
        .then((item)  => {
            if (!item) return;
            controller.choose();
        });
    } else if (justUpdated()) {
        // Do full build and reload on updates
        console.log('Post Update Themelier Full Build');
        // Silent full build
        builder.fullBuild();
        // If it's the current theme, rebuild the chosen theme with the controller assurances, and automatic reload
        const currentTheme = vscode.workspace.getConfiguration().get<string>('workbench.colorTheme');
        if (currentTheme === 'Themelier ' + data.modeName()) {
            controller.build(true);
        }
    }

    // Register Commands
    const rebuildCm = vscode.commands.registerCommand('themelier.rebuild', () => {
        controller.build();
    });

    const chooseCm = vscode.commands.registerCommand('themelier.choose', () => {
        controller.choose();
    });

    const exportCm = vscode.commands.registerCommand('themelier.export', () => {
        controller.export();
    });

    // Add to a list of disposables which are disposed when this extension is deactivated.
    context.subscriptions.push(data, builder, themeExport, controller, rebuildCm, chooseCm, exportCm);

}

// Method called when the extension is deactivated
export function deactivate(context: vscode.ExtensionContext) { }
