import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import WalletManagement from './WalletManagement'
import { useAuth } from '@/components/AuthProvider'

jest.mock('@/components/AuthProvider', () => ({
  useAuth: jest.fn()
}))

describe('WalletManagement', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: 'test-user', email: 'test@example.com' }
    })
  })

  it('renders wallet balances', () => {
    render(<WalletManagement />)
    expect(screen.getByText(/Available Balance/i)).toBeInTheDocument()
    expect(screen.getByText(/Locked Balance/i)).toBeInTheDocument()
  })

  it('opens deposit dialog', async () => {
    render(<WalletManagement />)
    fireEvent.click(screen.getByText(/Deposit \/ Withdraw/i))
    await waitFor(() => {
      expect(screen.getByText(/Select a payment method/i)).toBeInTheDocument()
    })
  })
})
