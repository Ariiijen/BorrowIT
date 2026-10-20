import { AuthFrame } from '../components/AuthFrame'
import { RegisterForm } from '../components/RegisterForm'

export function RegisterPage() {
  return <AuthFrame title="Create your account" subtitle="Set up your BorrowIT profile in under a minute."><RegisterForm /></AuthFrame>
}
