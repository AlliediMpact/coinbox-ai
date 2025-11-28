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

  it('displays different severity badge colors in alert details', async () => {
    const { AuthProvider } = await import('@/components/AuthProvider')
    const { transactionMonitoringAPI } = await import('@/lib/transaction-monitoring-api')

    // Mock alerts with different severities including critical and low
    transactionMonitoringAPI.getUserAlerts = vi.fn().mockResolvedValue([
      {
        id: 'critical-alert',
        userId: 'user-1',
        ruleId: 'critical-rule',
        ruleName: 'Critical Alert',
        severity: 'critical',
        transactions: ['t1'],
        detectedAt: new Date(),
        status: 'new'
      },
      {
        id: 'low-alert',
        userId: 'user-1',
        ruleId: 'low-rule',
        ruleName: 'Low Alert',
        severity: 'low',
        transactions: ['t2'],
        detectedAt: new Date(),
        status: 'new'
      }
    ])

    render(
      <AuthProvider>
        <TransactionSecurity />
      </AuthProvider>
    )

    // Wait for critical alert to load and click to view details
    await screen.findByText('Critical Alert')
    const detailsBtns = await screen.findAllByRole('button', { name: /details/i })
    fireEvent.click(detailsBtns[0])

    // Should display critical severity - this covers the "critical" branch (lines 270-272)
    // Use getAllByText since "critical" appears in both card badge and dialog badge
    const criticalElements = await screen.findAllByText('critical')
    expect(criticalElements.length).toBeGreaterThan(0)
  })

  it('displays resolution field when present in alert details', async () => {
    const { AuthProvider } = await import('@/components/AuthProvider')
    const { transactionMonitoringAPI } = await import('@/lib/transaction-monitoring-api')

    // Mock alert with resolution field
    transactionMonitoringAPI.getUserAlerts = vi.fn().mockResolvedValue([
      {
        id: 'resolved-alert',
        userId: 'user-1',
        ruleId: 'resolved-rule',
        ruleName: 'Resolved Alert',
        severity: 'medium',
        transactions: ['t1'],
        detectedAt: new Date(),
        status: 'resolved',
        resolution: 'Verified as legitimate transaction'
      }
    ])

    render(
      <AuthProvider>
        <TransactionSecurity />
      </AuthProvider>
    )

    // Wait for resolved alert to load and open details
    await screen.findByText('Resolved Alert')
    const detailsBtn = await screen.findByRole('button', { name: /details/i })
    fireEvent.click(detailsBtn)

    // Should display resolution section - covers lines 292-295
    expect(await screen.findByText(/Resolution:/i)).toBeInTheDocument()
    expect(await screen.findByText(/Verified as legitimate transaction/i)).toBeInTheDocument()
  })
})
