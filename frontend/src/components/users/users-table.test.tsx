/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UsersTable } from './users-table';
import type { UserRead } from '@/lib/api/types';

const navigateMock = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/lib/utils/clipboard', () => ({
  copyToClipboard: vi.fn().mockResolvedValue(true),
}));

const users: UserRead[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    created_at: '2026-06-01T12:00:00.000Z',
    first_name: 'Ada',
    last_name: 'Lovelace',
    email: 'ada@example.com',
    external_user_id: null,
    last_synced_at: null,
    last_synced_provider: null,
    has_active_connection: false,
  },
];

function renderUsersTable() {
  return render(
    <UsersTable
      data={users}
      total={users.length}
      page={1}
      pageSize={9}
      pageCount={1}
      onDelete={vi.fn()}
      onQueryChange={vi.fn()}
    />
  );
}

describe('UsersTable', () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it('navigates from user row cells except the ID and copy section', () => {
    renderUsersTable();

    const idCell = screen.getByText('123e4567...4000').closest('td');
    expect(idCell).not.toBeNull();

    fireEvent.click(idCell!);
    expect(navigateMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Ada Lovelace'));
    expect(navigateMock).toHaveBeenCalledWith({
      to: '/users/$userId',
      params: { userId: users[0].id },
    });
  });
});
