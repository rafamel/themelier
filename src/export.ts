'use strict';
import * as vscode from 'vscode'; // VS Code extensibility API
import { Data } from './data';

const merge = require('deepmerge'),
    sortObj = require('sort-object'),
    plist = require('plist-json'),
    spawn = require('spawn-command'),
    fs = require('fs-extra'),
    path = require('path'),
    fetch = require('node-fetch'),
    colorNamer = require('color-namer');

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

    private sortJsonKeys(themeObj) {
        themeObj = sortObj(themeObj,
                            ['name', 'author', 'colors', 'tokenColors', 'settings']);
        for (let item in themeObj) {
            if (!themeObj[item]) delete themeObj[item];
        }
        return themeObj;
    }

    private colorName(color: String): String {
        let names = colorNamer(color),
            ans = {'n': '', 'd': -1};
        for (let item in names) {
            let obj = names[item][0];
            if (ans['d'] === -1 || obj['distance'] <= ans['d']) {
                ans = {'n': obj['name'], 'd': obj['distance']};
            }
        }
        return ans['n'].charAt(0).toUpperCase() + ans['n'].slice(1);
    }

    private colorList(themeObj: Object): String {
        let tokenColors = themeObj['tokenColors'],
            colors = {},
            editor = {},
            strList = '## Colors\n',
            inheritance = this.data.inheritance['syntax'];
        tokenColors.forEach(x => {
            if (x.hasOwnProperty('name') && x.hasOwnProperty('settings') &&
                    x['settings'].hasOwnProperty('foreground')) {
                let names = x['name'],
                    hex = x['settings']['foreground'].slice(1),
                    colorName = this.colorName(x['settings']['foreground']),
                    scopes = '';
                names.split(', ').forEach(y => {
                    if (!inheritance.hasOwnProperty(y)) {
                        scopes += y.charAt(0).toUpperCase() + y.slice(1) + ', ';
                    }
                });
                scopes = scopes.slice(0, -2);
                if (!colors.hasOwnProperty(hex)) {
                    colors[hex] = {'scopes': scopes, 'name': colorName};
                } else {
                    colors[hex]['scopes'] += ', ' + scopes;
                }
            } else if (x.hasOwnProperty('settings')) {
                let main = x['settings'];
                ['background', 'foreground'].forEach(x => {
                    if (main.hasOwnProperty(x)) {
                        editor[main[x].slice(1)] = {
                            'scopes': x.charAt(0).toUpperCase() + x.slice(1),
                            'name': this.colorName(main[x]),
                        };
                    }
                })
            }
        });

        [ {'title': 'Editor', 'dict': editor},
            {'title': 'Syntax', 'dict': colors} ].forEach(({title, dict}) => {
            if (Object.keys(dict).length) {
                strList += `\n### ${ title }\n\n`;
                for (let hex in dict) {
                    let {scopes, name} = dict[hex];
                    strList += `* ![#${ hex }](https://placehold.it/15/${ hex }/000000?text=+) ${ name } **#${ hex }** - *${ scopes }*\n`;
                }
            }
        });

        return strList;
    }

    // Build tmTheme
    private tmtheme(themeObj, author) {
        // Author
        themeObj['author'] = author;

        // tokenColors
        for (let i = 0; i < themeObj['tokenColors'].length; i++) {
            let aRule = themeObj['tokenColors'][i];
            if (aRule.hasOwnProperty('scope')) {
                aRule['scope'] = aRule['scope'].join(',');
            }
        }
        themeObj['settings'] = themeObj['tokenColors'];
        delete themeObj['tokenColors'];

        // Build
        let plistStr = plist.build(this.sortJsonKeys(themeObj));
        this.openDocument(plistStr, 'xml');
    }

    // Build VSCode theme extension
    private extension(themeObj, mode, name, author, description) {

        let cwd = vscode.workspace.rootPath,
            generatorPath = path.join(cwd, 'vscode-generator-code'),
            identifier = name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            process = null;

        function run(cmd: string, reason: string = '', path = cwd) {
            return new Promise((accept, reject) => {
                let opts: any = {};
                if (vscode.workspace) opts.cwd = path;
                process = spawn(cmd, opts);
                process.on('close', (status) => {
                    if (status) reject(reason + ` Status code ${status}.`);
                    else accept();
                    process = null;
                });
            });
        }

        function statusUpdate(uptoProgress, speed) {
            function helper() {
                currentProgress++;
                statusBar.text = `Themelier progress: ${ String(currentProgress) } %`;
            }
            timeouts.forEach((timeout) => clearTimeout(timeout));
            let steps = uptoProgress - currentProgress,
                stepArray = Array(steps).fill(0).map((x,i) => x+i);
            stepArray.forEach(step => {
                timeouts.push(setTimeout(() => helper(), step*speed));
            });
        }

        let currentProgress = 0,
            timeouts = [],
            statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        statusBar.tooltip = 'Themelier progress';

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
            statusUpdate(10, 2000);
            statusBar.show();
            // Clone generator
            console.log('Running git');
            vscode.window.showInformationMessage(
                'Building the theme extension. Check the progress in the Status Bar.'
            );
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
                .then((pkgObj) => accept([pkgObj, jsonPath, jsonName]))
                .catch((err) => reject(this.data.fsError(err, 'Read', jsonName)));
            });
        })
        .then(([pkgObj, jsonPath, jsonName]) => {
            // Modify generator package.json
            console.log(`Writing generator ${jsonName}`);

            pkgObj['name'] = 'generator-themelier';
            delete pkgObj['scripts']['test'];
            return new Promise((accept, reject) => {
                fs.writeJson(jsonPath, pkgObj)
                .then((index) => accept())
                .catch((err) => reject(this.data.fsError(err, 'Write', jsonName)));
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
                .catch((err) => reject(this.data.fsError(err, 'Read', indexName)));
            });
        })
        .then(([index, indexPath, indexName]) => {
            // Modify generator index.js
            console.log(`Writing generator ${indexName}`);
            return new Promise((accept, reject) => {
                let replaceFrom = index.match(/constructor(.*){/)[0];
                if (!replaceFrom) reject('Error: Couldn\'t find generator constructor.')
                let replaceTo = replaceFrom
                        + `this.prompt=(o)=>{let a={};
                        a[o['name']]=dict[o['name']];return Promise.resolve(a);}`,
                    dict = {
                        'type': 'ext-colortheme',
                        'themeImportType': 'new',
                        'displayName': name,
                        'name': identifier,
                        'description': description,
                        'publisher': author,
                        'themeName': name,
                        'themeBase': (mode === 'light') ? 'vs' : 'vs-dark'
                    },
                    strDict = 'const dict = ' + JSON.stringify(dict) + ';';
                index = index.replace('var ', strDict + ' var ')
                            .replace(replaceFrom, replaceTo);
                fs.writeFile(indexPath, index, 'utf8')
                .then(() => accept())
                .catch((err) => reject(this.data.fsError(err, 'Write', indexName)));
            });
        })
        .then(() => {
            statusUpdate(80, 1000);
            // npm link
            console.log('Running npm link');
            return run(
                'npm link',
                '\'npm link\' failed.',
                generatorPath
            );
        })
        .then(() => {
            statusUpdate(80, 50);
            // yo
            console.log('Runnin yo');
            return run(
                'yo themelier',
                'Yeoman (\'yo\') failed.'
            );
        })
        .then(() => {
            // npm unlink
            statusUpdate(90, 250);
            console.log('Running npm unlink');
            return run(
                'npm unlink',
                '\'npm unlink\' failed. Traces of themelier building remain on your system.',
                generatorPath
            );
        })
        .then(() => {
            // Relocate theme
            statusUpdate(95, 500);
            console.log('Relocating theme');
            let tempPath = path.join(cwd, identifier);
            return new Promise((accept, reject) => {
                fs.copy(tempPath, cwd)
                .then(() => accept(tempPath))
                .catch((err) => reject(this.data.fsError(err, 'Copy', identifier)));
            });
        })
        .then((tempPath) => {
            // Remove generator dir
            console.log('Removing generator dir');
            let a = fs.remove(generatorPath),
                b = fs.remove(tempPath),
                c = fs.remove(path.join(cwd, 'vsc-extension-quickstart.md'));
            return new Promise((accept, reject) => {
                Promise.all([a,b,c])
                .then(() => accept())
                .catch((err) => reject(this.data.fsError(err, 'Delete', identifier)));
            });
        })
        .then(() => {
            // Read theme package.json
            let packageName = 'package.json',
                packagePath = path.join(cwd, packageName);
            console.log(`Reading theme ${packageName}`);

            return new Promise((accept, reject) => {
                fs.readJson(packagePath)
                .then((pkgObj) => accept([pkgObj, packagePath, packageName]))
                .catch((err) => reject(this.data.fsError(err, 'Read', packageName)));
            });
        })
        .then(([pkgObj, packagePath, packageName]) => {
            // Write theme package.json
            console.log(`Writing theme ${packageName}`);

            pkgObj['author'] = { 'name': author };
            pkgObj['license'] = 'SEE LICENSE IN LICENSE';
            if (mode === 'dark') pkgObj["galleryBanner"] = { "theme": "dark" };

            return new Promise((accept, reject) => {
                fs.writeFile(packagePath, JSON.stringify(pkgObj, null, 2), 'utf8')
                .then(() => accept(pkgObj))
                .catch((err) => reject(this.data.fsError(err, 'Write', packageName)));
            });
        })
        .then((pkgObj) => {
            // Write theme file
            console.log('Writing theme file');
            let themePath = path.join(cwd, pkgObj['contributes']['themes'][0]['path']),
                themeFileName = themePath.split('/').slice(-1);

            return new Promise((accept, reject) => {
                fs.writeFile(themePath, JSON.stringify(themeObj, null, 2), 'utf8')
                .then(() => accept())
                .catch((err) => reject(this.data.fsError(err, 'Write', themeFileName)));
            });
        })
        .then(() => {
            // Write theme README.md
            statusUpdate(98, 100);
            let readmeName = 'README.md',
            readmePath = path.join(cwd, readmeName);
            console.log(`Writing theme ${readmeName}`);

            let readme = `# ${ name }\n\n*${ description }*\n\n---\n\n${ this.colorList(themeObj) }\n---\n\nThis awesome theme was built with [Themelier](https://github.com/rafamel/themelier)`;

            return new Promise((accept, reject) => {
                fs.writeFile(readmePath, readme, 'utf8').then(() => accept())
                    .catch((err) => reject(this.data.fsError(err, 'Write', readmeName)));
            });
        })
        .then(() => {
            // Fetch MIT license
            let licenseName = 'LICENSE',
                licenseUrl = 'https://raw.githubusercontent.com/github/choosealicense.com/gh-pages/_licenses/mit.txt';
            console.log(`Fetching ${licenseName}`);
            return new Promise((accept, reject) => {
                fetch(licenseUrl)
                .then(res => res.text())
                .then((license) => {
                    license = license.split('---')[2];
                    if (license.indexOf('MIT License') !== -1) accept([license, licenseName]);
                    else reject(this.data.fsError('', 'Fetch', licenseName));
                })
                .catch((err) => reject(this.data.fsError(err, 'Fetch', licenseName)));
            });
        })
        .then(([license, licenseName]) => {
            // Write license
            console.log(`Writing ${licenseName}`);
            license = license
                .replace('[year]', String(new Date().getFullYear()))
                .replace('[fullname]', author);
            return new Promise((accept, reject) => {
                fs.writeFile(path.join(cwd, licenseName), license, 'utf8')
                    .then(() => accept())
                    .catch((err) => reject(this.data.fsError(err, 'Write', licenseName)));
            });
        })
        .then(() => {
            statusUpdate(100, 50);
            setTimeout(() => statusBar.dispose(), 2000);
            console.log('Themelier Theme Extension Built!')
            vscode.window.showInformationMessage(
                'Themelier Theme Extension Built! Press \'F5\' to test it!'
            );
        })
        .catch((reason) => {
            statusBar.dispose();
            vscode.window.showErrorMessage(reason)
        });

    }

    // Public export method
    public export(type: string, onlySyntax: string,
                mode: string, name: string, author: string, description: string) {

        // Get and parse current theme file
        let themeObj = this.data.getTheme(mode);

        // Include?
        if (themeObj.hasOwnProperty('include')) {
            let add = this.data.getTheme(themeObj['include'].slice(0,-5));

            let concatMerge = (a, b, types) => a.concat(b);
            themeObj = this.sortJsonKeys(
                merge(add, themeObj, { arrayMerge: concatMerge })
            );
        }

        // Change theme name
        themeObj['name'] = name;

        // onlySyntax
        if (onlySyntax !== 'all') {
            // Delete VSCode UI theming if we're only exporting basic UI theming or only syntax
            delete themeObj['colors'];
        }
        if (onlySyntax === 'syntax') {
            // Delete all editor theming but global foreground color if exporting only syntax
            let removed = false;
            for (let i = 0; i < themeObj['tokenColors'].length; i++) {
                let aRule = themeObj['tokenColors'][i];
                if (!aRule.hasOwnProperty('scope') && aRule.hasOwnProperty('settings')) {
                    if (aRule['settings'].hasOwnProperty('foreground')) {
                        aRule['settings'] = {
                            'foreground': aRule['settings']['foreground']
                        };
                    } else {
                        themeObj['tokenColors'][i] = undefined;
                        removed = true;
                    }
                }
            }
            if (removed) themeObj['tokenColors'] = themeObj['tokenColors'].filter(x => x);
        }

        // Types
        if (type === 'extension') this.extension(themeObj, mode, name, author, description);
        else if (type === 'json') this.openDocument(JSON.stringify(themeObj, null, 2), 'json');
        else if (type === 'tmtheme') this.tmtheme(themeObj, author);
    }

    dispose() {
    }

}
