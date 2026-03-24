import { SignOutButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'

export default async function UnauthorizedPage() {
  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress ?? 'unknown'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#ebebeb', fontFamily: "'DM Mono', monospace",
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: '0.1em', color: '#1a1a1a', marginBottom: 12 }}>
          ACCESS RESTRICTED
        </div>
        <p style={{ fontSize: 12, color: '#8a7e78', marginBottom: 8, lineHeight: 1.7 }}>
          This application is only available to ENSO team members.<br />
          Sign in with your ENSO or Playground Logic account.
        </p>
        <p style={{ fontSize: 11, color: '#a09088', marginBottom: 24, fontStyle: 'italic' }}>
          Signed in as: {email}
        </p>
        <SignOutButton redirectUrl="/sign-in">
          <button style={{
            background: '#1a1a1a', color: '#fff', border: 'none', padding: '10px 24px',
            fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.16em',
            textTransform: 'uppercase', cursor: 'pointer',
          }}>
            Sign Out & Try Again
          </button>
        </SignOutButton>
      </div>
    </div>
  )
}
