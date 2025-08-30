import { login } from './actions'

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold text-center">Admin Login</h1>
        <input className="w-full border rounded p-2" name="email" type="email" placeholder="Email" required />
        <input className="w-full border rounded p-2" name="password" type="password" placeholder="Mot de passe" required />
        <button formAction={login} className="w-full rounded p-2 border">Se connecter</button>
        <p className="text-sm text-center text-red-600 mt-2">
          {/* Affiche un message si err=1 dans l’URL (optionnel côté client, simple ici) */}
        </p>
      </form>
    </main>
  )
}
