// Checkbox: a tick-off checklist inside a note. Type // on an empty line and choose Checkbox; tick items, edit their text, add and remove them.
// Backspace on the only (empty) item, the × on the only item, or "Delete checklist" removes the whole block.
// Plain JS, no dependencies. Stored as text between ```checkbox fences, so the note still reads (and syncs and diffs) as text:
//
//   [x] buy milk
//   [ ] call mum

const LANG = "checkbox";
const MAX_ITEMS = 200;

/** One line of text: no line breaks (a break would split the item in two). */
const clean = (s) => s.replace(/\s+/g, " ").trim();

function parse(source) {
  const items = [];
  for (const line of source.split("\n").slice(0, MAX_ITEMS)) {
    const m = /^\s*\[([ xX])\]\s?(.*)$/.exec(line);
    if (m) items.push({ done: m[1] !== " ", text: clean(m[2]) });
    else if (line.trim() !== "") items.push({ done: false, text: clean(line) }); // a plain line becomes an unticked item
  }
  return items;
}

const serialize = (items) => items.map((i) => `${i.done ? "[x]" : "[ ]"} ${clean(i.text)}`).join("\n");

const fence = (items) => "```" + LANG + "\n" + serialize(items) + "\n```";

const CSS = `
body { font: 14px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: var(--text, #202124); padding: 2px 0 6px; }
.row { display: flex; align-items: center; gap: 8px; padding: 2px 0; }
.row input[type=checkbox] { width: 16px; height: 16px; margin: 0; accent-color: var(--accent, #4285f4); flex: none; }
.row .text { flex: 1; min-width: 0; font: inherit; color: inherit; background: transparent; border: 0; padding: 3px 4px; border-radius: 6px; }
.row .text:focus { outline: 1px solid var(--border, rgba(127,127,127,.4)); }
.row.done .text { color: var(--text-dim, #6b7280); text-decoration: line-through; }
.row .del { visibility: hidden; border: 0; background: none; color: var(--text-dim, #6b7280); cursor: pointer; font: inherit; padding: 0 4px; }
.row:hover .del, .row:focus-within .del { visibility: visible; }
.remove { margin: 2px 0 0 14px; border: 0; background: none; color: var(--text-dim, #6b7280); font: inherit; cursor: pointer; padding: 3px 0; visibility: hidden; }
#app:hover .remove, .remove:focus { visibility: visible; }
.add { margin-top: 2px; border: 0; background: none; color: var(--accent, #4285f4); font: inherit; font-weight: 600; cursor: pointer; padding: 3px 0; }
`;

function mount(el, source, block) {
  let items = parse(source);
  if (items.length === 0) items = [{ done: false, text: "" }];
  el.append(Object.assign(document.createElement("style"), { textContent: CSS }));
  const app = document.createElement("div");
  app.id = "app";
  el.append(app);

  const tell = () => block.resize(Math.ceil(app.getBoundingClientRect().height) + 10);
  const save = () => block.save(serialize(items.filter((i) => clean(i.text) !== "")));

  function render(focusIndex) {
    app.textContent = "";
    items.forEach((item, i) => {
      const row = document.createElement("div");
      row.className = "row" + (item.done ? " done" : "");
      const box = document.createElement("input");
      box.type = "checkbox";
      box.checked = item.done;
      box.addEventListener("change", () => {
        item.done = box.checked;
        row.classList.toggle("done", item.done);
        save();
      });
      const text = document.createElement("input");
      text.type = "text";
      text.className = "text";
      text.value = item.text;
      text.placeholder = "To do";
      text.addEventListener("input", () => {
        item.text = text.value;
        save();
      });
      text.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (items.length < MAX_ITEMS) items.splice(i + 1, 0, { done: false, text: "" });
          render(i + 1);
        } else if ((e.key === "Backspace" || e.key === "Delete") && text.value === "") {
          e.preventDefault();
          if (items.length === 1) return block.remove(); // the last, empty item: the whole checklist goes
          items.splice(i, 1);
          save();
          render(Math.max(0, i - 1));
        }
      });
      const del = document.createElement("button");
      del.type = "button";
      del.className = "del";
      del.setAttribute("aria-label", "Delete item");
      del.textContent = "×";
      del.addEventListener("click", () => {
        if (items.length === 1) return block.remove(); // deleting the only item deletes the checklist
        items.splice(i, 1);
        save();
        render();
      });
      row.append(box, text, del);
      app.append(row);
    });
    const add = document.createElement("button");
    add.type = "button";
    add.className = "add";
    add.textContent = "+ Add item";
    add.addEventListener("click", () => {
      if (items.length >= MAX_ITEMS) return;
      items.push({ done: false, text: "" });
      render(items.length - 1);
    });
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove";
    remove.textContent = "Delete checklist";
    remove.addEventListener("click", () => block.remove());
    app.append(add, remove);
    if (focusIndex !== undefined) app.querySelectorAll(".text")[focusIndex]?.focus();
    tell();
  }

  render();
  return {
    // The note changed from outside our own save (undo, or a sync from another device).
    update(next) {
      items = parse(next);
      if (items.length === 0) items = [{ done: false, text: "" }];
      render();
    },
  };
}

granite.blocks.register(LANG, mount);
granite.input.addItem({ id: "checkbox", name: "Checkbox", description: "A tick-off checklist", insert: () => fence([{ done: false, text: "" }]) });
