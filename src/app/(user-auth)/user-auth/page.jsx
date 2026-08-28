import { redirect } from 'next/navigation'
import React from 'react'

const Auth = () => {
  return redirect('/user-auth/login')
}

export default Auth