import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import TransactionMonitoring from '../../../components/admin/TransactionMonitoring'
import { AuthProvider } from '../../../components/AuthProvider'
import { beforeAll } from 'vitest'

beforeAll(() => {
  vi.mock('../../../components/AuthProvider', () => {
    return {
      AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
      useAuth: () => ({ user: { uid: 'admin' }, signIn: vi.fn(), signOut: vi.fn(), isAdmin: true })
    }
  })
})

// Utility functions are internal; covered via component render branches.

describe('TransactionMonitoring component', () => {
  it('renders rules, toggles status, and triggers handlers', () => {
    const rules = [
      { id: 'r1', name: 'High Value', enabled: true, threshold: 1000 },
      { id: 'r2', name: 'Velocity', enabled: false, threshold: 5 }
    ]
    const alerts = [
      { id: 'a1', title: 'High Value Alert', severity: 'high', status: 'open' }
    ]
    const onUpdateRule = vi.fn()
    const onUpdateAlert = vi.fn()

    render(
      <AuthProvider>
        <TransactionMonitoring
          rules={rules as any}
          alerts={alerts as any}
          onUpdateRule={onUpdateRule}
          onUpdateAlert={onUpdateAlert}
        />
      </AuthProvider>
    )

    expect(screen.getByText('High Value')).toBeInTheDocument()
    expect(screen.getByText('Velocity')).toBeInTheDocument()
    expect(screen.getByText('High Value Alert')).toBeInTheDocument()

    const toggle = screen.getByRole('checkbox', { name: /High Value/i })
    fireEvent.click(toggle)
    expect(onUpdateRule).toHaveBeenCalled()

    const alertRow = screen.getByText('High Value Alert')
    fireEvent.click(alertRow)
    expect(onUpdateAlert).toHaveBeenCalled()
  })
})
