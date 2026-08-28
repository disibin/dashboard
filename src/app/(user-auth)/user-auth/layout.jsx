import React from 'react'

export const metadata = {
  title: "Auth | Disibin",
  description: "Securely access your Disibin account."
}

const layout = ({ children }) => {
  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row bg-tertiary-light">
      <div className="w-full lg:w-1/2 hidden lg:flex flex-col items-center justify-center p-8 lg:p-12 bg-primary/5 border-r border-primary/10 text-center">
        <div className="max-w-md flex flex-col items-center gap-4">
          
          <h1 className="text-3xl lg:text-4xl font-bold text-tertiary-dark">
            Build Your Digital Future
          </h1>
          <p className="text-primary font-medium text-sm lg:text-base leading-relaxed">
            Securely access your Disibin dashboard to manage your websites,
            SaaS products, clients, and business operations from one place.
          </p>
        </div>
      </div>

      {/* Right panel for form content */}
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center bg-tertiary-light">
        <div className="w-full flex items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  )
}

export default layout

