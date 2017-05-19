'use strict';
import { Data } from './data';

export class Builder {

    constructor(private data: Data) {

    }

    // General
    public build() {
        console.log('Building Themelier Theme');

        let syntaxUiForPick = this.data.syntaxUiForPick(),
            syntaxFile = syntaxUiForPick['syntax'],
            uiFile = syntaxUiForPick['ui'],
            scopes = this.data.scopes,
            scopesKeys = this.data.scopesKeys,
            inheritance = this.data.inheritance,
            inheritanceKeys = this.data.inheritanceKeys;
        
        let tokenColors = [];
        for (let i = 0; i < scopesKeys.length; i++) {
            console.log(scopesKeys[i])
        }
    }

    public firstBuild() {

    }

    dispose() {
    }

}
