import { redirect } from 'next/navigation'
import React from 'react'

const Auth = () => {
  return redirect('/staff-auth/login')
}

export default Auth