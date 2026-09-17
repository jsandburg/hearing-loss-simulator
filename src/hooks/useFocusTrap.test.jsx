import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup, within } from '@testing-library/react';
import { useRef, useState } from 'react';
import { useFocusTrap } from './useFocusTrap.js';

afterEach(cleanup);

function Fixture({ isActive, onEscape }) {
  const ref = useRef(null);
  useFocusTrap(ref, { isActive, onEscape });
  if (!isActive) return <div><button>Outside</button></div>;
  return (
    <div ref={ref}>
      <button>First</button>
      <input type="text" />
      <button>Last</button>
    </div>
  );
}

describe('useFocusTrap', () => {
  it('moves focus to the first focusable element on activation', () => {
    const { container } = render(<Fixture isActive={true} onEscape={vi.fn()} />);
    expect(document.activeElement).toBe(within(container).getAllByRole('button')[0]);
  });

  it('focuses the [data-autofocus] element instead of the first when present', () => {
    function AutofocusFixture() {
      const ref = useRef(null);
      useFocusTrap(ref, { isActive: true });
      return (
        <div ref={ref}>
          <button>Close</button>
          <input type="text" data-autofocus />
        </div>
      );
    }
    const { container } = render(<AutofocusFixture />);
    expect(document.activeElement).toBe(within(container).getByRole('textbox'));
  });

  it('restores focus to the opener when deactivated', () => {
    function Opener() {
      const [open, setOpen] = useState(false);
      const ref = useRef(null);
      useFocusTrap(ref, { isActive: open });
      return (
        <div>
          <button onClick={() => setOpen(true)}>Open</button>
          {open && (
            <div ref={ref}>
              <input type="text" data-autofocus />
              <button onClick={() => setOpen(false)}>Done</button>
            </div>
          )}
        </div>
      );
    }
    const { getByText } = render(<Opener />);
    const opener = getByText('Open');
    opener.focus();
    fireEvent.click(opener);
    expect(document.activeElement.tagName).toBe('INPUT');
    fireEvent.click(getByText('Done'));
    expect(document.activeElement).toBe(opener);
  });

  it('does not move focus when inactive', () => {
    const before = document.activeElement;
    render(<Fixture isActive={false} onEscape={vi.fn()} />);
    expect(document.activeElement).toBe(before);
  });

  it('calls onEscape when Escape is pressed', () => {
    const onEscape = vi.fn();
    render(<Fixture isActive={true} onEscape={onEscape} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onEscape).toHaveBeenCalledOnce();
  });

  it('does not call onEscape when inactive', () => {
    const onEscape = vi.fn();
    render(<Fixture isActive={false} onEscape={onEscape} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('Tab from last element wraps focus to first', () => {
    const { container } = render(<Fixture isActive={true} onEscape={vi.fn()} />);
    const buttons = within(container).getAllByRole('button');
    buttons[buttons.length - 1].focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('Shift+Tab from first element wraps focus to last', () => {
    const { container } = render(<Fixture isActive={true} onEscape={vi.fn()} />);
    const buttons = within(container).getAllByRole('button');
    buttons[0].focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
  });

  it('Tab from a middle element does not wrap', () => {
    const { container } = render(<Fixture isActive={true} onEscape={vi.fn()} />);
    const input = within(container).getByRole('textbox');
    input.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });
    // Hook only intercepts Tab on the last element; focus stays on input
    expect(document.activeElement).toBe(input);
  });
});
