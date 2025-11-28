import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import TransactionSecurity from '../../components/TransactionSecurity'

// Install mocks at top-level to avoid hoisting issues
vi.mock('@/components/AuthProvider', () => {
  return {
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useAuth: () => ({ user: { uid: 'user-1' }, signIn: vi.fn(), signOut: vi.fn() })
  }
})

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}))

vi.mock('@/lib/transaction-monitoring-api', () => ({
  transactionMonitoringAPI: {
    checkUserTradingStatus: vi.fn().mockResolvedValue({
      status: 'normal',
      alerts: 2,
      criticalAlerts: 1,
      isFlagged: false,
      reason: null
    }),
    getUserAlerts: vi.fn().mockResolvedValue([
      {
        id: 'a1',
        userId: 'user-1',
        ruleId: 'high-value',
        ruleName: 'High Value Transaction',
        severity: 'high',
        transactions: ['t1'],
        detectedAt: new Date(),
        status: 'new'
      },
      {
        id: 'a2',
        userId: 'user-1',
        ruleId: 'velocity',
        ruleName: 'Medium Velocity',
        severity: 'medium',
        transactions: ['t2'],
        detectedAt: new Date(),
        status: 'under-review'
      }
    ])
  }
}))

describe('TransactionSecurity component', () => {
  it('renders alerts and maps severity classes', async () => {
    const { AuthProvider } = await import('@/components/AuthProvider')
    render(
      <AuthProvider>
        <TransactionSecurity />
      </AuthProvider>
    )

    // Await async load completion
    expect(await screen.findByText('Security Alerts')).toBeInTheDocument()

    // Alert rule names should be visible
    expect(await screen.findByText('High Value Transaction')).toBeInTheDocument()
    expect(await screen.findByText('Medium Velocity')).toBeInTheDocument()
  })

  it('refresh button triggers data reload', async () => {
    const { AuthProvider } = await import('@/components/AuthProvider')
    const { transactionMonitoringAPI } = await import('@/lib/transaction-monitoring-api')

    render(
      <AuthProvider>
        <TransactionSecurity />
      </AuthProvider>
    )

    // Wait for initial render
    await screen.findByText('Security Alerts')

    const btn = await screen.findByRole('button', { name: /refresh/i })
    fireEvent.click(btn)

    // Both status and alerts should be fetched again
    expect(transactionMonitoringAPI.checkUserTradingStatus).toHaveBeenCalled()
    expect(transactionMonitoringAPI.getUserAlerts).toHaveBeenCalled()
  })

  it('opens alert details on click', async () => {
    const { AuthProvider } = await import('@/components/AuthProvider')
    render(
      <AuthProvider>
        <TransactionSecurity />
      </AuthProvider>
    )

    // Wait for alerts to load
    await screen.findByText('High Value Transaction')
    const detailsBtn = await screen.findAllByRole('button', { name: /details/i })
    fireEvent.click(detailsBtn[0])

    // Dialog should show
    expect(await screen.findByText(/Alert details/i)).toBeInTheDocument()
    expect(await screen.findByText(/Severity:/i)).toBeInTheDocument()
  })
})
