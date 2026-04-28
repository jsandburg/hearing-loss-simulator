import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup, within } from '@testing-library/react';
import { useRef } from 'react';
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
