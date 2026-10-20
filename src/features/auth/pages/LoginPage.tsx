import { AuthFrame } from '../components/AuthFrame'
import { LoginForm } from '../components/LoginForm'

export function LoginPage() {
  return <AuthFrame title="Welcome back" subtitle="Log in to manage your equipment."><LoginForm /></AuthFrame>
}
