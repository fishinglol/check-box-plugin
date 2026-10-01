# Checkbox

A tick-off **checklist** inside a note, drawn in place on desktop and phone. A plugin for [Granite](https://github.com/fishinglol/grantie).

- Permissions: **Draw its own blocks inside your notes** (`editor.blocks`) and **See what you type on an empty line and what you paste**
  (`editor.input`, only for the entry in the `//` list). It never reads your other notes and has no network.
  Needs Granite with plugin API 4 (`minApiVersion`).
- Install: from the **Store** tab of Plugins.

## Use

- Type **`//`** alone on an empty line and choose **Checkbox**.
- Tick items off. **Enter** adds an item below, **Backspace** on an empty item removes it, **×** deletes one, **+ Add item** adds one at the end.

## How it is stored

As text between ```` ```checkbox ```` fences, one `[ ]` / `[x]` line per item, so it stays readable and syncs like any note:

````
```checkbox
[x] buy milk
[ ] call mum
```
````

## License

MIT
