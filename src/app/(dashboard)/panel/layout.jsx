import PanelLayout from "@/component/staff/bars/PanelLayout"
import { isStaffLogin } from "@/lib/auth/staff"
import { redirect } from "next/navigation"

export const metadata = {
  title: 'Management Dashboard | Disibin',
  description: 'Administrative interface for managing Disibin studio operations.',
}

export default async function Layout({ children }) {
  const auth = await isStaffLogin()
  if (!auth.success) return redirect('/staff-auth/login')

  return <PanelLayout>{children}</PanelLayout>
}
