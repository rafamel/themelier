# Advanced Themelier Settings

## Extended UI Theming

### Colors

These are all the properties you can define in the `themelier.ui` object of your `settings.json`:

- `foreBackground`: Main background color: Editor, Title Bar,  Notifications, and Sidebar.
- `backBackground`: Secondary background color: Activity Bar, Peek View, and Input.
- `selection`: For selected text.
- `border`: For a contrast border between areas.
- `buttons`: Action buttons and Activity Bar badges.

### Grouping

As you can see, both the *Editor* and the *Sidebar* are grouped by default (both are part of the `fore-background`), but this can change depending on your *base UI theme*. Some will make the *Sidebar* be in the `back-background` and the *Activity Bar* in the `fore-background`. You can control this behavior in the `themelier.sidebarBack` property of your `settings.json` by setting it to `"true"` or `"false"` (as a string):

```javascript
themelier.sidebarBack: "true"
```

The above example will make the *Sidebar* be in the `back-background` and the *Activity Bar* in the `fore-background`.


## Extended Syntax Theming

These are all the scopes you can define in the `themelier.syntax` object of your `settings.json`:

- `global`: The color all non-defined scopes fall back to; text.

- Programming
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


