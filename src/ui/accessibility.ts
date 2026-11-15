export function panelControls(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not(:disabled),input,select,summary,[tabindex="0"]',
    ),
  ).filter((element) => {
    const closed = element.closest("details:not([open])");
    return !closed || element === closed.querySelector(":scope > summary");
  });
}

export function trapFocus(container: HTMLElement) {
  document.addEventListener("keydown", (event) => {
    if (container.hidden || event.key !== "Tab") return;
    const elements = panelControls(container);
    if (!elements.length) return;
    const i = elements.indexOf(document.activeElement as HTMLElement);
    event.preventDefault();
    elements[
      (i + (event.shiftKey ? -1 : 1) + elements.length) % elements.length
    ].focus();
  });
}
