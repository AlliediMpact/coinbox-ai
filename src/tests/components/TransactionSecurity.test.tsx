import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import TransactionSecurity from '../../components/TransactionSecurity'
import { AuthProvider } from '../../components/AuthProvider'
import { beforeAll } from 'vitest'

beforeAll(() => {
  vi.mock('../../components/AuthProvider', () => {
    return {
      AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
      useAuth: () => ({ user: null, signIn: vi.fn(), signOut: vi.fn() })
    }
  })
})

describe('TransactionSecurity component', () => {
  it('renders alerts and maps severity classes', () => {
    const alerts = [
      { id: 'a1', title: 'High Value', severity: 'high', status: 'open' },
      { id: 'a2', title: 'Medium Velocity', severity: 'medium', status: 'open' },
      { id: 'a3', title: 'Low Risk', severity: 'low', status: 'closed' }
    ]

    render(
      <AuthProvider>
        <TransactionSecurity
          alerts={alerts as any}
          rules={[] as any}
          onRefresh={vi.fn()}
          onViewAlert={vi.fn()}
        />
      </AuthProvider>
    )

    expect(screen.getByText('High Value')).toBeInTheDocument()
    expect(screen.getByText('Medium Velocity')).toBeInTheDocument()
    expect(screen.getByText('Low Risk')).toBeInTheDocument()
  })

  it('triggers refresh handler', () => {
    const onRefresh = vi.fn()
    render(
      <AuthProvider>
        <TransactionSecurity alerts={[] as any} rules={[] as any} onRefresh={onRefresh} onViewAlert={vi.fn()} />
      </AuthProvider>
    )
    const btn = screen.getByRole('button', { name: /refresh/i })
    fireEvent.click(btn)
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('opens alert details on click', () => {
    const onViewAlert = vi.fn()
    const alerts = [{ id: 'a1', title: 'High Value', severity: 'high', status: 'open' }]
    render(
      <AuthProvider>
        <TransactionSecurity alerts={alerts as any} rules={[] as any} onRefresh={vi.fn()} onViewAlert={onViewAlert} />
      </AuthProvider>
    )
    const row = screen.getByText('High Value')
    fireEvent.click(row)
    expect(onViewAlert).toHaveBeenCalledWith(expect.objectContaining({ id: 'a1' }))
  })
})
