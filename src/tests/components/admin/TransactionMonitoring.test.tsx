import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import TransactionMonitoring from '../../../components/admin/TransactionMonitoring'
import { AuthProvider } from '../../../components/AuthProvider'

beforeAll(() => {
  vi.mock('@/components/AuthProvider', () => {
    return {
      AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
      useAuth: () => ({ user: { uid: 'admin-1' }, signIn: vi.fn(), signOut: vi.fn(), isAdmin: true })
    }
  })

  vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({ toast: vi.fn() })
  }))

  vi.mock('@/lib/transaction-monitoring-api', () => ({
    transactionMonitoringAPI: {
      getAllAlerts: vi.fn().mockResolvedValue([
        {
          id: 'a1',
          userId: 'user-1',
          ruleId: 'high-value',
          ruleName: 'High Value Transaction',
          severity: 'high',
          transactions: ['t1'],
          detectedAt: new Date(),
          status: 'new'
        }
      ]),
      getMonitoringRules: vi.fn().mockResolvedValue([
        {
          id: 'r1',
          name: 'High Value',
          description: 'Single high-value transaction',
          thresholds: { timeWindow: 60, minAmount: 10000 },
          severity: 'high',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'r2',
          name: 'Velocity',
          description: 'Too many transactions quickly',
          thresholds: { timeWindow: 10, maxTransactions: 5 },
          severity: 'medium',
          enabled: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]),
      updateAlertStatus: vi.fn().mockResolvedValue({ success: true }),
      updateMonitoringRule: vi.fn().mockResolvedValue({ success: true })
    }
  }))
})

describe('TransactionMonitoring component', () => {
  it('renders alerts and rules, toggles rule, and updates alert', async () => {
    render(
      <AuthProvider>
        <TransactionMonitoring />
      </AuthProvider>
    )

    // Await loaded tabs/content
    expect(await screen.findByText('Transaction Alerts')).toBeInTheDocument()
    expect(await screen.findByText('Monitoring Rules')).toBeInTheDocument()

    // Alerts table shows the mocked alert
    expect(await screen.findByText('High Value Transaction')).toBeInTheDocument()

    // Open alert details via View button
    const viewBtns = await screen.findAllByRole('button', { name: /view/i })
    fireEvent.click(viewBtns[0])
    expect(await screen.findByText(/Alert Details/i)).toBeInTheDocument()

    // Click Resolve button
    const resolveBtn = await screen.findByRole('button', { name: /resolve/i })
    fireEvent.click(resolveBtn)
    const { transactionMonitoringAPI } = await import('@/lib/transaction-monitoring-api')
    expect(transactionMonitoringAPI.updateAlertStatus).toHaveBeenCalled()

    // Switch to rules tab and toggle a rule
    const rulesTab = screen.getByRole('tab', { name: /monitoring rules/i })
    await userEvent.click(rulesTab)

    // Wait for rules card description to ensure content rendered
    await screen.findByText(/configure transaction monitoring rules/i)
    // Open rule edit dialog for the first rule
    const editBtns = await screen.findAllByRole('button', { name: /edit/i })
    fireEvent.click(editBtns[0])
    expect(await screen.findByText(/Edit Monitoring Rule/i)).toBeInTheDocument()

    // Toggle Enabled switch inside dialog and save changes
    const enabledSwitch = await screen.findByRole('switch', { name: /enabled/i })
    fireEvent.click(enabledSwitch)
    const saveBtn = await screen.findByRole('button', { name: /save changes/i })
    fireEvent.click(saveBtn)
    expect(transactionMonitoringAPI.updateMonitoringRule).toHaveBeenCalled()
  })

  it('marks alert as under review', async () => {
    render(
      <AuthProvider>
        <TransactionMonitoring />
      </AuthProvider>
    )

    const viewBtns = await screen.findAllByRole('button', { name: /view/i })
    fireEvent.click(viewBtns[0])
    
    const underReviewBtn = await screen.findByRole('button', { name: /mark under review/i })
    fireEvent.click(underReviewBtn)
    
    const { transactionMonitoringAPI } = await import('@/lib/transaction-monitoring-api')
    expect(transactionMonitoringAPI.updateAlertStatus).toHaveBeenCalledWith('a1', 'under-review', '', 'admin-1')
  })

  it('marks alert as false positive', async () => {
    render(
      <AuthProvider>
        <TransactionMonitoring />
      </AuthProvider>
    )

    const viewBtns = await screen.findAllByRole('button', { name: /view/i })
    fireEvent.click(viewBtns[0])
    
    const falsePositiveBtn = await screen.findByRole('button', { name: /false positive/i })
    fireEvent.click(falsePositiveBtn)
    
    const { transactionMonitoringAPI } = await import('@/lib/transaction-monitoring-api')
    expect(transactionMonitoringAPI.updateAlertStatus).toHaveBeenCalledWith('a1', 'false-positive', '', 'admin-1')
  })

  it('clicks refresh button', async () => {
    render(
      <AuthProvider>
        <TransactionMonitoring />
      </AuthProvider>
    )

    await screen.findByText('Transaction Alerts')
    const refreshBtn = screen.getByRole('button', { name: /refresh/i })
    fireEvent.click(refreshBtn)
    
    const { transactionMonitoringAPI } = await import('@/lib/transaction-monitoring-api')
    expect(transactionMonitoringAPI.getAllAlerts).toHaveBeenCalled()
  })
})
