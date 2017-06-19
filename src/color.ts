'use strict';
import * as vscode from 'vscode'; // VS Code extensibility API
import * as tinycolor from 'tinycolor2';
import * as colorNamer from 'color-namer';

export class ColorHex {

    public hex: string;
    public nodash: string;

    constructor (str: string) {
        const isValid = (color) => {
            return (color.match(/^#[0-9a-f]{3,8}$/i) &&
                (color.length === 4 || color.length === 7 || color.length === 9));
        };
        this.hex = (isValid(str)) ? str : '';
        this.nodash = this.hex.slice(1);
    }

    public toString() { return this.hex; }

    public isValid() { return !!this.hex; }

    public get modified(): ColorHex {
        const light = vscode.workspace.getConfiguration().get<number>('themelier.light');
        const saturation = vscode.workspace.getConfiguration().get<number>('themelier.saturation');
        if (light === 0 && saturation === 0) {
            return this;
        }
        let tColor = tinycolor(this.hex);

        if (light !== 0) {
            tColor = (light > 0) ?
                tColor.lighten(light) :
                tColor.darken(Math.abs(light));
        }
        if (saturation !== 0) {
            tColor = (saturation > 0) ?
                tColor.saturate(saturation) :
                tColor.desaturate(Math.abs(saturation));
        }
        return new ColorHex(tColor.toHexString());
    }

    public modify(pc: number, mode: string): ColorHex {
        function toReadable(amount: number = 1, dark: boolean = null) {
            if (dark === null) dark = tColor.isDark();

            let newTColor = tinycolor(tColor.toHexString());
            newTColor = ((dark)
                ? newTColor.lighten(amount)
                : newTColor.darken(amount)).greyscale();
            if (amount === 100) return newTColor;

            const readability = tinycolor.readability(
                tColor.toHexString(),
                newTColor.toHexString()
            );
            return (readability < 15) ? toReadable(amount + 1, dark) : newTColor;
        }
        if (pc === 0) return this;
        let tColor = tinycolor(this.hex);

        if (pc < 0) {
            tColor = toReadable();
        } else {
            tColor = ((mode === 'light')
                ? tColor.greyscale().darken(pc)
                : tColor.lighten(pc));
        }
        return new ColorHex(tColor.toHexString());
    }

    public get name(): string {
        const names = colorNamer(this.hex);
        let ans = {'n': '', 'd': -1};
        Object.keys(names).forEach(item => {
            const obj = names[item][0];
            if (ans.d === -1 || obj.distance <= ans.d) {
                ans = {'n': obj.name, 'd': obj.distance};
            }
        });
        return ans.n.charAt(0).toUpperCase() + ans.n.slice(1);
    }

}
