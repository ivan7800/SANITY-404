export function trapFocus(container: HTMLElement) {
  document.addEventListener("keydown", (event) => {
    if (container.hidden || event.key !== "Tab") return;
    const elements = Array.from(
      container.querySelectorAll<HTMLElement>(
        'button:not(:disabled),input,select,[tabindex="0"]',
      ),
    );
    if (!elements.length) return;
    const i = elements.indexOf(document.activeElement as HTMLElement);
    event.preventDefault();
    elements[
      (i + (event.shiftKey ? -1 : 1) + elements.length) % elements.length
    ].focus();
  });
}
