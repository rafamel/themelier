# Extended Themelier Settings

## Syntax Theming

### Scopes & Inheritance

All third-level scopes (such as `definition` or `htmlTag`) will inherit from their parents following the **inheritance tree** below - so if a second-level scope (such as `variable` or `property`) is not defined for a theme, it will default to `global`, as well as any of its third-level children, if any.

Keep in mind some *base themes* could make third-level scope inherit from different second-level scopes to the ones below. For more on this, check the [theme building documentation](https://github.com/rafamel/themelier/tree/master/docs/theme-building.md).

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

You can check the definition for all basic scopes [at the main *Syntax Theming* documentation](https://github.com/rafamel/themelier/blob/master/README.md). Here's the rest:

- Variables, types and classes:
    - `definition`: Variables at definition time (when possible) or when placed as a receiving parameter of a function.
    - `reserved`: Reserved variables such as `this`, `self`, and `super`.
    - `class`: Non built-in types and classes.

- HTML & CSS:
    - `htmlTag`: Such as `<link>` and `<div>` for HTML, or `header` and `div ul` for CSS.
    - `htmlId`: HTML & CSS `id` attribute.
    - `htmlAttr`: HTML attributes such as `href`, `type`, or `class`.
    - `cssProperty`: CSS properties, such as `color`, `background`, or `border`.

- Markup (such as Markdown):
    - `mkHeading`: Headings (such as `# Heading` in Markdown) and punctuation (such as `*` and `-` for lists or `>` for quotes in Markdown).
    - `mkBold`: Bold text.
    - `mkItalic`: Italic text.
    - `mkLinkText`: The text part of a link.
    - `mkLinkUrl`: The url part of a link.

## UI Theming

These are all the properties you can define in the `themelier.ui` object of your `settings.json`. As you can see, they follow the same inheritance structure as for syntax themes, with two instead of three levels of inheritance (as there is no `global` color).

- `mainBackground`: Main background color for the Editor.
    - `sidebar`: Sidebar (left *Explorer* bar).
    - `statusBar`: Status Bar (bottom).
    - `titleBar`: Title Bar (top).
- `altBackground`: Secondary background color for top tabs background (inactive tabs and free space) - and notifications (when possible).
    - `activityBar`: Activity Bar (left icon bar).
- `selection`: For selected text.
- `line`: Line number and indentation guides.
- `border`: For a contrast border between areas.
- `badge`: Activity Bar badges - and buttons (when possible).

Notifications and Buttons issue: 
