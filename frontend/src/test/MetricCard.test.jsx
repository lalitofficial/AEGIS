import { render, screen } from '@testing-library/react'
import { Shield } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import MetricCard from '../components/MetricCard'

describe('MetricCard', () => {
  it('renders title, value, and subtitle', () => {
    render(
      <MetricCard
        title="Fraud Detection Rate"
        value="98.2%"
        icon={Shield}
        subtitle="Last 24 hours"
      />
    )
    expect(screen.getByText('Fraud Detection Rate')).toBeInTheDocument()
    expect(screen.getByText('98.2%')).toBeInTheDocument()
    expect(screen.getByText('Last 24 hours')).toBeInTheDocument()
  })

  it('shows an upward trend indicator for positive trends', () => {
    render(<MetricCard title="Alerts" value="12" icon={Shield} trend={5} />)
    expect(screen.getByText(/↑ 5%/)).toBeInTheDocument()
  })
})
