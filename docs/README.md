# Advanced Themelier Settings

## Extended UI Theming

These are all the properties you can define in the `themelier.ui` object of your `settings.json`:

- `foreBackground`: Main background color: Editor, Status Bar, Title Bar, and Sidebar.
    - `sidebar`: Sidebar. Inherits from `foreBackground` by default.
- `backBackground`: Secondary background color: Peek View, Input, and Activity Bar.
    - `activityBar`: Sidebar. Inherits from `backBackground` by default.
- `selection`: For selected text.
- `line`: Line number and indentation guides.
- `border`: For a contrast border between areas.
- `badge`: Activity Bar badges.

## Extended Syntax Theming

These are all the scopes you can define in the `themelier.syntax` object of your `settings.json`:

- `global`: The color all non-defined scopes fall back to; text.
- `string`: Strings, also inlines and quotes in a markup language (like Markdown).
- `comment`: Comments.
- `punctuation`: Brackets, colons, dots and other punctuation.
- `variable`: Variables.
- `definition`: Variables at definition time (when possible) or when placed as a receiving parameter of a function.
- `property`: Object keys and variable properties (excluding functions).
- `function`: Function names.
- `keyword`: Such as `for`, `while`, and so on.
- `storage`: Such as `public`, `private`, `var` or `function`.
- `operator`: Such as `+`, `-`, or `=`.
- `support`: Built-in functions, modules, types, and classes. Also primitives.
- `reserved`: Reserved variables such as `this`, `self`, and `super`.
- `class`: Non built-in types and classes.
- `constant`: Constants.

- HTML & CSS
    - `htmlTag`: Such as `<link>` and `<div>` for HTML, or `header` and `div ul` for CSS.
    - `htmlId`: HTML & CSS id attribute: ( `id` ).
    - `htmlAttr`: HTML attributes such as `href`, `type`, or `class`.
    - `cssProperty`: CSS properties, such as `color`, `background`, or `border`.

- Markup (such as Markdown)
    - `mkHeading`: Headings and punctuation. In Markdown, for example, it would be applied to `# Headings`, punctuation for lists (`*`, `-`), puntuation for quotes (`>`) and so on.
    - `mkBold`: Bold text.
    - `mkItalic`: Italic text.
    - `mkLinkText`: The text part of a link.
    - `mkLinkUrl`: The url part of a link.

## Syntax Inheritance Rules

All non defined scopes will inherit from their parents following the inheritance tree:

- `global`
    - `string`
    - `comment`
    - `punctuation`
    - `variable`
        - `definition`
    - `property`
        - `htmlTag`
        - `cssProperty`
        - `mkHeading`
    - `function`
        - `htmlId`
        - `mkLinkText`
    - `keyword`
        - `storage`
        - `mkItalic`
    - `operator`
        - `mkLinkUrl`
    - `support`
        - `reserved`
        - `class`
    - `constant`
        - `htmlAttr`
        - `mkBold`

An example of `themelier.syntax` using these could be:

```javascript
themelier.syntax: {
    "storage": "#FFF",
    "support": "#E5C07B",
    "reserved": "#D19A66"
}
```

This would:
- Make `storage` (which initially inherited from `keyword`) be white, while maintaining the color defined by the current *base theme* for `keyword` (and `mkItalic`, as it inherits from it).
- Make `support` be `#E5C07B` (and therefore, also `class`, as it inherits from `support`). However, `reserved` (which originally also inherited from `support`) will now be `#D19A66`.


