import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#ebebeb',
      }}
    >
      <SignIn />
    </div>
  )
}
