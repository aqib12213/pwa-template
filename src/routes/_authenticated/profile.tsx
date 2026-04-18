import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { DB } from '@/db/db'

export const Route = createFileRoute('/_authenticated/profile')({
  component: RouteComponent,
})

function RouteComponent() {
  const [user, setUser] = useState(null)
  useEffect(() => {
    const fetchUser = async () => {
      const user = await DB.members.get('darklight3173@gmail.com')
      console.log('Current user:', user)
      setUser(user)
    }
    fetchUser()
  }, [])
  return <div>Hello {user?.name}!</div>
}
