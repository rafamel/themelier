'use strict';
import * as vscode from 'vscode'; // VS Code extensibility API
import { Data } from './data';

const merge = require('deepmerge'),
    sortObj = require('sort-object'),
    plist = require('plist-json'),
    spawn = require('spawn-command'),
    fs = require('fs-extra'),
    path = require('path');


export class ThemeExport {

    constructor(private data: Data) {

    }

    // Helpers
    private openDocument(content, language) {
        vscode.workspace.openTextDocument({content: content, language: language})
        .then((doc) => {
            vscode.window.showTextDocument(doc);
        }, (reason) => {
                console.log(reason);
        });
    }

    private sortJsonKeys(themeObject) {
        themeObject = sortObj(themeObject, ['name', 'author', 'colors', 'tokenColors', 'settings']);
        for (let item in themeObject) {
            if (!themeObject[item]) delete themeObject[item];
        }
        return themeObject;
    }

    public writeJson(path:string, obj: Object) {
        fs.writeFileSync(path, JSON.stringify(obj, null, 2), 'utf8');
    }

    // Build tmTheme
    private tmtheme(themeObject, author) {
        // Author
        themeObject['author'] = author;

        // tokenColors
        for (let i = 0; i < themeObject['tokenColors'].length; i++) {
            let thisRule = themeObject['tokenColors'][i];
            if (thisRule.hasOwnProperty('scope')) {
                thisRule['scope'] = thisRule['scope'].join(',');
            }
        }
        themeObject['settings'] = themeObject['tokenColors'];
        delete themeObject['tokenColors'];

        // Build
        let plistStr = plist.build(this.sortJsonKeys(themeObject));
        this.openDocument(plistStr, 'xml');
    }

    // Build VSCode theme extension
    private run(cmd:string, reason: string = '', path = cwd) {
        return new Promise((accept, reject) => {
            let opts : any = {};
            if (vscode.workspace) opts.cwd = path;
            process = spawn(cmd, opts);
            process.on('close', (status) => {
                if (status) reject(reason + `Status code ${status}.`);
                else accept();
                process = null;
            });
        });
    }
    private extension(content, mode, name, author, description = name) { // CHC description=name

        let cwd = vscode.workspace.rootPath,
            generatorPath = path.join(cwd, 'vscode-generator-code'),
            identifier = 'th-' + name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            process = null;

        this.run(
            // Check Git
            'git --help',
            'Git doesn\'t seem to be installed: '
        )
        .then(() => {
            // Check npm
            return this.run(
                'npm help',
                'npm doesn\'t seem to be installed: '
            );
        })
        .then(() => {
            // Check Yeoman
            return this.run(
                'yo --help',
                'Yeoman doesn\'t seem to be installed (http://yeoman.io/): '
            );
        })
        .then(() => {
            // Clone generator
            vscode.window.showInformationMessage('Building the theme. Please wait, it\'ll take a while');
            return this.run(
                'git clone https://github.com/Microsoft/vscode-generator-code.git',
                '\'git clone\' error: '
            );
        })
        .then(() => {
            // Modify generator package.json
            return new Promise((accept, reject) => {
                try {
                    let jsonPath = path.join(generatorPath, 'package.json'),
                        packageObj = fs.readJsonSync(jsonPath);
                    packageObj['name'] = 'generator-themelier';
                    delete packageObj['scripts']['test'];
                    fs.writeJsonSync(jsonPath, packageObj);
                    accept();
                } catch (err) { reject('Error: ' + err); }
            });
        })
        .then(() => {
            // Modify generator index.js
            return new Promise((accept, reject) => {
                try {
                    let indexPath = path.join(generatorPath, 'generators/app/index.js'),
                        index = fs.readFileSync(indexPath, 'utf8'),
                        replaceFrom = index.match(/constructor(.*)/)[0],
                        replaceTo = replaceFrom + ` this.prompt = function(obj) { let ans = {};
                        ans[obj['name']] = dict[obj['name']]; return Promise.resolve(ans); }`,
                        dict = {
                            'type': 'ext-colortheme',
                            'themeImportType': 'new',
                            'displayName': name,
                            'name': identifier,
                            'description': name, // TODO Description
                            'publisher': author,
                            'themeName': name,
                            'themeBase': (mode === 'light') ? 'vs' : 'vs-dark'
                        },
                        strDict = 'const dict = ' + JSON.stringify(dict) + ';';
                    index = index.replace('var ', strDict + ' var ').replace(replaceFrom, replaceTo);
                    fs.writeFileSync(indexPath, index, 'utf8');
                    accept();
                } catch (err) { reject('Error: ' + err); }
            });
        })
        .then(() => {
            // npm link
            console.log('Running npm link');
            return this.run(
                'npm link',
                '\'npm link\' failed: ',
                generatorPath
            );
        })
        .then(() => {
            // npm link
            console.log('Runnin yo');
            return this.run(
                'yo themelier',
                '\'yo\' failed: ',
                generatorPath
            );
        })
        .then(() => {
            // npm link
            console.log('Running npm unlink');
            return this.run(
                'npm unlink',
                '\'npm unlink\' failed. Traces of themelier building remain on your system. ',
                generatorPath
            );
        })
        .then(() => {
            // Relocate theme and remove generator dir
            return new Promise((accept, reject) => {
                try {
                    fs.copySync(path.join(generatorPath, identifier), cwd);
                    fs.removeSync(generatorPath);
                    fs.removeSync(path.join(cwd, 'vsc-extension-quickstart.md'));
                    accept();
                } catch (err) { reject('Error: ' + err); }
            });
        })
        .then(() => {
            // Relocate theme and remove generator dir
            return new Promise((accept, reject) => {
                try {
                    let packagePath = path.join(cwd, 'package.json'), // TODO Add license
                        packageObj = fs.readJsonSync(packagePath),
                        themePath = path.join(cwd, packageObj['contributes']['themes'][0]['path']);
                    // Write theme file
                    fs.writeFileSync(themePath, content);
                    // TODO Write package.json if (mode === dark) pg["galleryBanner"] = { "theme": "dark" };

                    // Write README.md TODO: Add colors & descriptions
                    let readme = `# ${name}\n\n${description}\n\n---\n
                    An awesome theme built with [Themelier](https://github.com/rafamel/themelier)`;
                    fs.writeFileSync(path.join(cwd, 'README.md'), content, 'utf8');
                    accept();
                } catch (err) { reject('Error: ' + err); }
            });
        })
        .then(() => {
            vscode.window.showInformationMessage('Theme built! Press \'F5\' to test it!');
        })
        .catch((reason) => { vscode.window.showErrorMessage(reason); });

    }

    // Public export method
    public export(option: string, onlySyntax: string, mode: string, name: string, author: string) {

        // TODO: basic UI in tokenColors

        // Get and parse current theme file
        let themeObject = this.data.getTheme(mode);

        // Include?
        if (themeObject.hasOwnProperty('include')) {
            let add = this.data.getTheme(themeObject['include'].slice(0,-5));

            let concatMerge = (a, b, options) => a.concat(b);
            themeObject = this.sortJsonKeys(merge(add, themeObject, { arrayMerge: concatMerge }));
        }

        // Change theme name
        themeObject['name'] = name;

        // onlySyntax
        if (onlySyntax !== 'all') {
            // Delete VSCode UI theming if we're only exporting basic UI theming or only syntax
            delete themeObject['colors'];
        }
        if (onlySyntax === 'syntax') {
            // Delete all editor theming but global foreground color if exporting only syntax
            let removed = false;
            for (let i = 0; i < themeObject['tokenColors'].length; i++) {
                let thisRule = themeObject['tokenColors'][i];
                if (!thisRule.hasOwnProperty('scope') && thisRule.hasOwnProperty('settings')) {
                    if (thisRule['settings'].hasOwnProperty('foreground')) {
                        thisRule['settings'] = { 'foreground': thisRule['settings']['foreground'] };
                    } else {
                        themeObject['tokenColors'][i] = undefined;
                        removed = true;
                    }
                }
            }
            if (removed) themeObject['tokenColors'] = themeObject['tokenColors'].filter(x => x);
        }

        // Options
        if (option === 'tmtheme') {
            this.tmtheme(themeObject, author);
            return;
        }
        let content = JSON.stringify(themeObject, null, 2);
        if (option === 'json') this.openDocument(content, 'json');
        else if (option === 'extension') this.extension(content, mode, name, author);
    }

}
