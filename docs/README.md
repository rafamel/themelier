# Advanced Themelier Settings

## Extended UI Theming

These are all the properties you can define in the `themelier.ui` object of your `settings.json`:

- `foreBackground`: Main background color: Editor, Status Bar, and Title Bar.
    - `sidebar`: Sidebar. Inherits from `foreBackground` by default, but themes can alter it.
- `backBackground`: Secondary background color: Peek View, and Input.
    - `activityBar`: Activity Bar. Inherits from `backBackground` by default, but themes can alter it.
- `selection`: For selected text.
- `line`: Line number and indentation guides.
- `border`: For a contrast border between areas.
- `badge`: Activity Bar badges.

## Extended Syntax Theming

### Full List of Scopes

All third-level scopes (such as `definition` or `htmlTag`) will inherit from their parents following the **inheritance tree** below (so if a second-level scope is not defined for a theme, it will default to `global`, as well as any of its third-level children, if any).

Keep in mind some *base themes* could have a different inheritance tree - however, this will only affect third-level scopes, as second-level scopes cannot be made to inherit from other scopes at the same level.

These are also all the scopes you can define in the `themelier.syntax` object of your `settings.json`:

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
        - `mkItalic`
    - `storage`
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
    "support": "#E5C07B",
    "reserved": "#D19A66"
}
```

This would make `support` be `#E5C07B` (and therefore, also class). However, `reserved` (which originally also inherited from `support`) will now be `#D19A66`.

### Definitions

You can check the definition for all basic scopes [at the main *Syntax Theming* instructions](https://github.com/rafamel/themelier/blob/master/README.md). Here's the rest:

- Variables, types and classes
    - `definition`: Variables at definition time (when possible) or when placed as a receiving parameter of a function.
    - `reserved`: Reserved variables such as `this`, `self`, and `super`.
    - `class`: Non built-in types and classes.

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
