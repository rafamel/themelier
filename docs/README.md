# Advanced Themelier Settings

## Extended UI Theming

These are all the properties you can define in the `themelier.ui` object of your `settings.json`:

- `foreBackground`: Main background color: Editor, Status Bar, Title Bar, and Sidebar.
    - `sidebar`: Sidebar. Inherits from `foreBackground` by default.
- `backBackground`: Secondary background color: Peek View, Input, and Activity Bar.
    - `activityBar`: Activity Bar. Inherits from `backBackground` by default.
- `selection`: For selected text.
- `line`: Line number and indentation guides.
- `border`: For a contrast border between areas.
- `badge`: Activity Bar badges.

## Extended Syntax Theming

### Inheritance tree

All non defined scopes will inherit from their parents following the inheritance tree below. These are all the scopes you can define in the `themelier.syntax` object of your `settings.json`:

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

### Definitions

You can check the definition for all basic scopes [at the main *Readme*](https://github.com/rafamel/themelier/blob/master/README.md). Here's the rest:

- Variables:
    - `definition`: Variables at definition time (when possible) or when placed as a receiving parameter of a function.

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
