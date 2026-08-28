import UserPanelLayout from "@/component/user/bars/UserPanelLayout"
import { isUserLogin } from "@/lib/auth/user"
import { redirect } from "next/navigation"

export const metadata = {
  title: 'My Dashboard | Disibin',
  description: 'Manage your purchases, tickets, and account settings on Disibin.',
}

export default async function Layout({ children }) {
  const auth = await isUserLogin()
  if (!auth.success) return redirect('/user-auth/login')

  return <UserPanelLayout>{children}</UserPanelLayout>
}
