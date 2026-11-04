import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import FieldError from './FieldError';

afterEach(cleanup);

describe('FieldError', () => {
  it('shows the message', () => {
    render(<FieldError message="Enter your email." />);
    expect(screen.getByRole('alert').textContent).toBe('Enter your email.');
  });

  it('shows nothing when there is no message', () => {
    render(<FieldError message="" />);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
