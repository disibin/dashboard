import { isStaffLogin } from '@/lib/auth/staff'
import { redirect } from 'next/navigation'
import React from 'react'

export const metadata = {
  title: "Verify Account | Disibin Staff",
  description: "Verify your Disibin staff account email address."
}

const layout = async({ children }) => {
  const auth=await isStaffLogin()
    if(auth.success) return redirect('/panel')
  
  return (
    <>{children}</>
  )
}

export default layout
