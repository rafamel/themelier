'use strict';
import * as vscode from 'vscode'; // VS Code extensibility API
import { Data } from './data';

const merge = require('deepmerge'),
    sortObj = require('sort-object'),
    plist = require('plist-json'),
    spawn = require('spawn-command'),
    fs = require('fs-extra'),
    path = require('path'),
    fetch = require('node-fetch');


export class ThemeExport {

    constructor(private data: Data) {

    }

    // Helpers
    private openDocument(content, language) {
        vscode.workspace.openTextDocument({content: content, language: language})
        .then((doc) => {
            vscode.window.showTextDocument(doc);
        }, (reason) => { console.log(reason); });
    }

    private sortJsonKeys(themeObject) {
        themeObject = sortObj(themeObject, ['name', 'author', 'colors', 'tokenColors', 'settings']);
        for (let item in themeObject) {
            if (!themeObject[item]) delete themeObject[item];
        }
        return themeObject;
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
    private extension(content, mode, name, author, description = name) { // FIXME description=name

        // TODO: Show progress

        let cwd = vscode.workspace.rootPath,
            generatorPath = path.join(cwd, 'vscode-generator-code'),
            identifier = name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            process = null;

        function run(cmd:string, reason: string = '', path = cwd) {
            return new Promise((accept, reject) => {
                let opts : any = {};
                if (vscode.workspace) opts.cwd = path;
                process = spawn(cmd, opts);
                process.on('close', (status) => {
                    if (status) reject(reason + ` Status code ${status}.`);
                    else accept();
                    process = null;
                });
            });
        }
        const fsError = (err: Object, type: String, file: String) => {
            return type + ` error (${file}). ` + String(err).replace('Error:','');
        }

        run(
            // Check Git
            'git --help',
            'Git doesn\'t seem to be installed.'
        )
        .then(() => {
            // Check npm
            return run(
                'npm help',
                'npm doesn\'t seem to be installed.'
            );
        })
        .then(() => {
            // Check Yeoman
            return run(
                'yo --help',
                'Yeoman doesn\'t seem to be installed (http://yeoman.io/).'
            );
        })
        .then(() => {
            // Clone generator
            vscode.window.showInformationMessage('Building the theme. Please wait, it\'ll take a while');
            console.log('Running git');
            return run(
                'git clone https://github.com/Microsoft/vscode-generator-code.git',
                '\'git clone\' error.'
            );
        })
        .then(() => {
            // Read generator package.json
            let jsonName = 'package.json',
                jsonPath = path.join(generatorPath, jsonName);
            console.log(`Reading generator ${jsonName}`);

            return new Promise((accept, reject) => {
                fs.readJson(jsonPath)
                    .then((packageObj) => accept([packageObj, jsonPath, jsonName]))
                    .catch((err) => reject(fsError(err, 'Read', jsonName)));
            });
        })
        .then(([packageObj, jsonPath, jsonName]) => {
            // Modify generator package.json
            console.log(`Writing generator ${jsonName}`);

            packageObj['name'] = 'generator-themelier';
            delete packageObj['scripts']['test'];
            return new Promise((accept, reject) => {
                fs.writeJson(jsonPath, packageObj).then((index) => accept())
                    .catch((err) => reject(fsError(err, 'Write', jsonName)));
            });
        })
        .then(() => {
            // Read generator index.js
            let indexName = 'index.js',
                indexPath = path.join(generatorPath, 'generators/app/' + indexName);
            console.log(`Reading generator ${indexName}`);

            return new Promise((accept, reject) => {
                fs.readFile(indexPath, 'utf8')
                    .then((index) => accept([index, indexPath, indexName]))
                    .catch((err) => reject(fsError(err, 'Read', indexName)));
            });
        })
        .then(([index, indexPath, indexName]) => {
            // Modify generator index.js
            console.log(`Writing generator ${indexName}`);
            return new Promise((accept, reject) => {
                let replaceFrom = index.match(/constructor(.*){/)[0];
                if (!replaceFrom) reject('Error: Couldn\'t find generator constructor.')
                let replaceTo = replaceFrom
                        + "this.prompt=(o)=>{let a={};a[o['name']]=dict[o['name']];return Promise.resolve(a);}",
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

                fs.writeFile(indexPath, index, 'utf8').then(() => accept())
                    .catch((err) => reject(fsError(err, 'Write', indexName)));
            });
        })
        .then(() => {
            // npm link
            // TODO: running without npm linking?
            console.log('Running npm link');
            return run(
                'npm link',
                '\'npm link\' failed.',
                generatorPath
            );
        })
        .then(() => {
            // yo
            console.log('Runnin yo');
            return run(
                'yo themelier',
                'Yeoman (\'yo\') failed.'
            );
        })
        .then(() => {
            // npm unlink
            console.log('Running npm unlink');
            return run(
                'npm unlink',
                '\'npm unlink\' failed. Traces of themelier building remain on your system.',
                generatorPath
            );
        })
        .then(() => {
            // Relocate theme
            console.log('Relocating theme');
            let tempPath = path.join(cwd, identifier);
            return new Promise((accept, reject) => {
                fs.copy(tempPath, cwd)
                    .then(() => accept(tempPath))
                    .catch((err) => reject(fsError(err, 'Copy', identifier)));
            });
        })
        .then((tempPath) => {
            // Remove generator dir
            console.log('Removing generator dir');
            let a = fs.remove(generatorPath),
                b = fs.remove(tempPath),
                c = fs.remove(path.join(cwd, 'vsc-extension-quickstart.md'));
            return new Promise((accept, reject) => {
                Promise.all([a,b,c]).then(() => accept())
                    .catch((err) => reject(fsError(err, 'Delete', identifier)));
            });
        })
        .then(() => {
            // Read theme package.json
            let packageName = 'package.json',
                packagePath = path.join(cwd, packageName);
            console.log(`Reading theme ${packageName}`);

            return new Promise((accept, reject) => {
                fs.readJson(packagePath)
                    .then((packageObj) => accept([packageObj, packagePath, packageName]))
                    .catch((err) => reject(fsError(err, 'Read', packageName)));
            });
        })
        .then(([packageObj, packagePath, packageName]) => {
            // Write theme package.json
            console.log(`Writing theme ${packageName}`);

            packageObj['author'] = { 'name': author };
            packageObj['license'] = 'SEE LICENSE IN LICENSE';
            if (mode === 'dark') packageObj["galleryBanner"] = { "theme": "dark" };

            return new Promise((accept, reject) => {
                fs.writeFile(packagePath, JSON.stringify(packageObj, null, 2), 'utf8')
                    .then(() => accept(packageObj))
                    .catch((err) => reject(fsError(err, 'Write', packageName)));
            });
        })
        .then((packageObj) => {
            // Write theme file
            console.log('Writing theme file');
            let themePath = path.join(cwd, packageObj['contributes']['themes'][0]['path']),
                themeFileName = themePath.split('/').slice(-1);

            return new Promise((accept, reject) => {
                fs.writeFile(themePath, content, 'utf8').then(() => accept())
                    .catch((err) => reject(fsError(err, 'Write', themeFileName)));
            });
        })
        .then(() => {
            // Write theme README.md
            let readmeName = 'README.md',
            readmePath = path.join(cwd, readmeName);
            console.log(`Writing theme ${readmeName}`);

            // TODO: Add colors & descriptions
            let readme = `# ${name}\n\n${description}\n\n---\nAn awesome theme built with [Themelier](https://github.com/rafamel/themelier)`;

            return new Promise((accept, reject) => {
                fs.writeFile(readmePath, readme, 'utf8').then(() => accept())
                    .catch((err) => reject(fsError(err, 'Write', readmeName)));
            });
        })
        .then(() => {
            // Fetch MIT license
            let licenseName = 'LICENSE';
            console.log(`Fetching ${licenseName}`);
            return new Promise((accept, reject) => {
                fetch('https://raw.githubusercontent.com/github/choosealicense.com/gh-pages/_licenses/mit.txt')
                .then(res => res.text())
                .then((license) => {
                    license = license.split('---')[2];
                    if (license.indexOf('MIT License') !== -1) accept([license, licenseName]);
                    else reject(fsError('', 'Fetch', licenseName));
                })
                .catch((err) => reject(fsError(err, 'Fetch', licenseName)));
            });
        })
        .then(([license, licenseName]) => {
            // Write license
            console.log(`Writing ${licenseName}`);
            license = license
                .replace('[year]', String(new Date().getFullYear()))
                .replace('[fullname]', author);
            return new Promise((accept, reject) => {
                fs.writeFile(path.join(cwd, licenseName), license, 'utf8').then(() => accept())
                    .catch((err) => reject(fsError(err, 'Write', licenseName)));
            });
        })
        .then(() => {
            console.log('Themelier Theme Built!')
            vscode.window.showInformationMessage('Themelier Theme Built! Press \'F5\' to test it!');
        })
        .catch((reason) => vscode.window.showErrorMessage(reason));

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
