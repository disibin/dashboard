import { isStaffLogin } from '@/lib/auth/staff'
import { redirect } from 'next/navigation'
import React from 'react'

export const metadata={
    title:"Login | Disibin",
    description:"Login and access your account. Disibin"
}

const  layout = async({children}) => {
  const auth=await isStaffLogin()
  if(auth.success) return redirect('/panel')

  return (
    <>{children}</>
  )
}

export default layout