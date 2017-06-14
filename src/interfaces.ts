'use strict';

import { ColorHex } from './color';

// Choice
export interface IChoice {
    syntax: string;
    ui: string;
    forMode?: string;
    explicit?: boolean;
    valid?: boolean;
}

// Structure
export interface IDarkLightObjs {
    dark: { [key: string]: string; };
    light: { [key: string]: string; };
}

export interface IScopes {
    syntax: { [key: string]: string[]; };
    ui: { [key: string]: { [key: string]: number } };
}

export interface IInheritanceRoot {
    syntax: { [key: string]: string[]; };
    ui: { [key: string]: string[]; };
}

export interface IInheritance {
    syntax: { [key: string]: string; };
    ui: { [key: string]: string; };
}

// Themes
export interface IBaseThemes {
    syntax: { [key: string]: string; };
    ui: { [key: string]: string; };
}

export interface ISingleBaseThemeRoot {
    colors: { [key: string]: string; };
    inheritance?: { [key: string]: string; };
}

export interface ISingleFoundationTheme {
    colors: { [key: string]: ColorHex; };
    inheritance?: { [key: string]: string; };
}

export interface ITheme {
    syntax: ISingleFoundationTheme;
    ui: ISingleFoundationTheme;
}

export interface ITokenColor {
    settings: { [key: string]: string; };
    name?: string;
    scope?: string[];
}

export interface IJsonTheme {
    tokenColors: ITokenColor[];
    name?: string;
    colors?: { [key: string]: string; };
    include?: string;
}

export interface IBaseTheme extends ITheme {
    forChoice?: IChoice;
    valid?: [boolean, string];
}
