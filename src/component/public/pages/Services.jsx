'use client'
import React from 'react'
import { motion } from 'framer-motion'
import {
  FiMonitor,
  FiSmartphone,
  FiTrendingUp,
  FiCloud,
  FiShield,
  FiCheckCircle,
  FiCompass,
  FiLayout,
  FiCode,
  FiLock,
  FiSend,
  FiRefreshCw
} from 'react-icons/fi'

const coreServices = [
  {
    icon: FiMonitor,
    title: 'Enterprise Web Apps',
    badge: 'Core Platform',
    desc: 'Multi-tenant dashboards, complex permission management, secure financial transactions, and real-time data streaming.',
    ideal: 'SaaS platforms, e-commerce, and business portals.',
  },
  {
    icon: FiSmartphone,
    title: 'Mobile Applications',
    badge: 'Mobile Systems',
    desc: 'Native-feeling cross-platform mobile apps built with offline synchronization, biometric security, and push notifications.',
    ideal: 'Consumer apps, field operations, and mobile tools.',
  },
  {
    icon: FiTrendingUp,
    title: 'Business Innovation',
    badge: 'Growth Engine',
    desc: 'AI-assisted process automation, executive decision dashboards, and legacy system modernization without downtime.',
    ideal: 'Scaling enterprises and digital transformations.',
  },
  {
    icon: FiCloud,
    title: 'Cloud Architecture',
    badge: 'Infrastructure',
    desc: 'High-availability microservices, automated CI/CD deployment pipelines, cloud cost optimization, and secure API gateways.',
    ideal: 'High-traffic applications and scalable backends.',
  },
]

const sixWorkCards = [
  {
    phase: '01',
    icon: FiCompass,
    title: 'Discovery & Architecture Blueprint',
    subtitle: 'System Blueprint & Schema Design',
    desc: 'We map PostgreSQL database relationships, multi-tenant boundaries, role-based access control (RBAC), and security requirements before writing code.',
    activities: [
      'Database ERD & Schema Mapping',
      'API Contract & Endpoints Design',
      'Multi-tenant Boundary Definition',
      'Security & Risk Assessment'
    ],
    deliverable: 'Architecture Blueprint',
  },
  {
    phase: '02',
    icon: FiLayout,
    title: 'UI/UX Strategy & Prototyping',
    subtitle: 'Interactive Prototypes & Tokens',
    desc: 'Transforming requirements into clickable high-fidelity prototypes. You validate user journeys, admin dashboards, and component design tokens early.',
    activities: [
      'Responsive Component Specs',
      'High-Fidelity Wireframing',
      'Interactive User Flow Simulation',
      'Design Token Standardization'
    ],
    deliverable: 'Staging Prototype',
  },
  {
    phase: '03',
    icon: FiCode,
    title: 'Agile Innovation & Engineering',
    subtitle: 'Parallel Front & Backend Build',
    desc: 'Bi-weekly sprint milestones with continuous integration. Clean modular codebase, type safety, and real-time staging preview access throughout the build.',
    activities: [
      'Concurrent API & UI Development',
      'Type-Safe TypeScript Implementation',
      'Automated CI/CD Pipeline Setup',
      'Bi-Weekly Sprint Demos'
    ],
    deliverable: 'Production Staging Code',
  },
  {
    phase: '04',
    icon: FiLock,
    title: 'QA & Security Boundary Audits',
    subtitle: 'Stress Testing & Rate Limiting',
    desc: 'Comprehensive performance and security validation. Query load testing, multi-role permission isolation checks, and responsive design audits.',
    activities: [
      'SQL Query Indexing & Load Tests',
      'Role Isolation & Security Audit',
      'Cross-Device & Browser Testing',
      'API Rate Limiting & Auth Checks'
    ],
    deliverable: 'QA & Security Certificate',
  },
  {
    phase: '05',
    icon: FiSend,
    title: 'Production Launch & Infrastructure',
    subtitle: 'Zero-Downtime Release & Edge CDN',
    desc: 'Production release using automated database migrations, cloud edge caching, live performance telemetry, and descriptive architecture documentation.',
    activities: [
      'Zero-Downtime Pipeline Launch',
      'Edge Cache & DNS Optimization',
      'Real-Time Telemetry & Monitoring',
      'Technical Docs Hand-off'
    ],
    deliverable: 'Live Production Platform',
  },
  {
    phase: '06',
    icon: FiRefreshCw,
    title: 'Continuous Support & Optimization',
    subtitle: 'Telemetry Monitoring & SLA Care',
    desc: 'Post-launch maintenance, continuous performance tuning, security patches, proactive health monitoring, and scaling support as your business grows.',
    activities: [
      '24/7 Monitoring & Error Alerting',
      'Performance Optimization Patches',
      'Dependency & Security Updates',
      'Dedicated SLA Maintenance'
    ],
    deliverable: 'Continuous Support & SLA',
  },
]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: false, amount: 0.2 },
  transition: { duration: 0.5, ease: 'easeOut', delay },
})

export default function Services() {
  return (
    <div className="w-full antialiased space-y-16 ">

      <motion.section {...fadeUp()} className="w-full text-center max-w-3xl mx-auto p-4 md:p-8 space-y-3">
        <h2 className="font-poppins text-3xl sm:text-5xl font-semibold text-slate-900 leading-tight">
          We engineer <span className="text-primary font-semibold">high-performance</span> digital products
        </h2>
        <p className="text-slate-500 font-poppins text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          From enterprise web applications to business process innovation, we engineer software designed for speed, scale, and long-term performance.
        </p>
      </motion.section>

      <motion.section {...fadeUp(0.1)} className="w-full px-2 p-4 md:p-8">
        <div className="mb-6 text-center sm:text-left">
          <h3 className="font-poppins text-xl sm:text-2xl font-semibold text-slate-900">What We Build</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {coreServices.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.title}
                {...fadeUp(i * 0.08 + 0.1)}
                className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-100 shadow-xs hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100/80 border border-slate-200/60 px-2.5 py-1 rounded-full">
                      {s.badge}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-poppins font-semibold text-slate-900 text-base mb-1.5 group-hover:text-primary transition-colors">{s.title}</h4>
                    <p className="text-slate-500 text-xs leading-relaxed font-poppins">{s.desc}</p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">Ideal For</span>
                  <p className="text-slate-800 font-medium text-xs font-poppins">{s.ideal}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      <motion.section {...fadeUp(0.1)} className="w-full px-2 bg-primary p-4 md:p-8">
        <div className="mb-8 text-center">
          <h3 className="font-poppins text-2xl sm:text-4xl font-semibold text-tertiary-light">How We Work &amp; Launch</h3>
          <p className="text-tertiary text-xs sm:text-sm mt-1.5 max-w-lg mx-auto font-poppins">
            A structured 6-phase engineering workflow designed to deliver high-quality software predictably.
          </p>
        </div>

        {/* 6 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sixWorkCards.map((card, i) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.phase}
                {...fadeUp(i * 0.08 + 0.1)}
                className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-100 shadow-xs hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary font-poppins block">
                          Phase {card.phase}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400 font-poppins block truncate max-w-[150px]">
                          {card.subtitle}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-md shrink-0 font-poppins">
                      {card.deliverable}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-poppins font-semibold text-slate-900 text-base mb-1.5 group-hover:text-primary transition-colors">
                      {card.title}
                    </h4>
                    <p className="text-slate-500 text-xs leading-relaxed font-poppins">
                      {card.desc}
                    </p>
                  </div>

                  {/* Activities */}
                  <div className="pt-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-poppins block mb-2">
                      Key Activities
                    </span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {card.activities.map((act) => (
                        <div key={act} className="flex items-center gap-2 text-[11px] font-medium text-slate-700 bg-slate-50/60 hover:bg-slate-50 p-2 rounded-xl border border-slate-100/60 transition-colors">
                          <FiCheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Commitment Banner */}
        <div className="mt-8 bg-white/80 border border-slate-100 rounded-2xl shadow-xs p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FiShield className="w-5 h-5 text-primary" />
          </div>
          <p className="text-slate-600 text-xs leading-relaxed font-poppins">
            <span className="text-slate-900 font-semibold">Production Guarantee:</span> Clean, modular codebases with full technical documentation and type safety, ensuring seamless scalability for your team.
          </p>
        </div>
      </motion.section>

    </div>
  )
}