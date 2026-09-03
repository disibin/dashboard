import React from 'react'

export const metadata = {
  title: "Staff Auth | Disibin",
  description: "Secure access for Disibin staff members."
}

const layout = ({ children }) => {
  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row bg-tertiary-light">
      <div className="w-full lg:w-1/2 hidden lg:flex flex-col items-center justify-center p-5 lg:p-4 bg-primary/5 border-r border-primary/10 text-center">
        <div className="max-w-md flex flex-col items-center gap-4">

          <h1 className="text-3xl lg:text-4xl font-semibold text-tertiary-dark">
            Staff Portal
          </h1>
          <p className="text-primary font-medium text-sm lg:text-base leading-relaxed">
            Securely access your employee dashboard to manage your daily responsibilities, schedules, attendance, tasks, and institutional resources.
          </p>
        </div>
      </div>


      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center bg-tertiary-light">
        <div className="w-full flex items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  )
}

export default layout

