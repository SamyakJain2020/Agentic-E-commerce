export const profile = {
  name: 'Samyak Jain',
  title: 'MBA Candidate · AI & Finance',
  tagline: 'I turn messy operations into AI-driven, straight-through processes — across trade finance, regulatory compliance, and agentic products.',
  email: 'samyak.jain016@nmims.in',
  location: 'Mumbai, India',
  linkedin: 'https://www.linkedin.com/in/2samyakj/',
  github: 'https://github.com/SamyakJain2020',
  resume: '/Samyak_Jain_Resume.pdf',
}

export const services = [
  {
    title: 'AI-Driven Process Automation',
    body: 'Designing agentic AI workflows for trade finance and back-office ops — from document extraction to straight-through processing, with human-in-the-loop guardrails.',
  },
  {
    title: 'Regulatory Data Engineering',
    body: 'Building compliant, auditable data pipelines at scale (Azure, Databricks, PySpark) for financial-services regulatory reporting.',
  },
  {
    title: 'Financial Modeling & Valuation',
    body: 'DCF, SOTP, comparables and Basel III capital-adequacy analysis, grounded in Bloomberg Terminal data.',
  },
  {
    title: 'Agentic Product Design',
    body: 'Prototyping LLM-powered agents — shopping assistants, compliance copilots, chatbots — from architecture to shipped product.',
  },
]

export const experience = [
  {
    org: 'Axis Bank',
    role: 'Summer Intern — Transformation',
    period: 'Summer 2026',
    points: [
      'Designed the AI workflow for Trade Finance Export Bill processing, projecting ₹1.2 Cr in savings.',
      'Used Gemini and Cleareye across 200+ document fields for automation and straight-through processing.',
      'Invented a Compliance AI Agent with a Confidence Matrix acting as guardrails between Maker and Checker agents.',
      'Authored a 3-phase AI roadmap delivering ~40% efficiency gains across Trade Finance operations.',
      'Presented the AI transformation roadmap and a corporate-client personalisation proposal to senior leadership.',
    ],
  },
  {
    org: 'UBS Business Solutions',
    role: 'Graduate Trainee',
    period: 'Aug 2024 – May 2025 · 9 months',
    points: [
      'Delivered US regulatory compliance mandates (FINRA) for Union Bank of Switzerland.',
      'Built 80+ data-quality and compliance controls to US regulatory standards.',
      'Drove data pipelines processing 10M+ records/day on Azure, Databricks, and PySpark.',
      'Team delivered USD 3.1M in hard cost savings across 9 petabytes of market regulatory data.',
      'Pioneered the conceptualization and delivery of an AI tool adopted across regulated business units.',
    ],
  },
  {
    org: 'Vidya India',
    role: 'We Care — Civic Engagement',
    period: '2025',
    points: [
      'Built financial and operational dashboards giving leadership data-led strategic insight.',
      'Visualized donor retention and program-donor mapping to inform fundraising strategy.',
      'Authored the FY26 AGM board strategy, synthesizing KPIs for the COO’s keynote.',
    ],
  },
  {
    org: 'NPCI',
    role: 'Intern — e-Rupee Core Team',
    period: 'Jul – Sep 2022',
    points: [
      'Worked with the e-Rupee core development team on end-to-end Hyperledger Fabric integration.',
      'Evaluated and fine-tuned e-Rupee performance against UPI benchmarks.',
    ],
  },
]

export const education = [
  { degree: 'MBA', school: 'SBM, NMIMS Mumbai', meta: 'NMIMS · CGPA 7.3/10', period: '2025 – 2027' },
  { degree: 'BE, Information Technology', school: 'PICT, Pune', meta: 'Pune University (SPPU) · CGPA 9.15/10', period: '2020 – 2024' },
  { degree: 'XII', school: 'R N Podar High School, Mumbai', meta: 'CBSE · 93.60%', period: '2020' },
  { degree: 'X', school: 'Gopal Sharma International, Mumbai', meta: 'ICSE · 93.50%', period: '2018' },
]

export const certifications = [
  { name: 'KPMG Certified Lean Six Sigma Green Belt', year: '2025' },
  { name: 'NISM-Series-XV: Research Analyst Certification', year: '2025' },
  { name: 'Published Research Paper — "Leveraging LLM-Advanced AI Chatbot for Healthcare"', year: '2024' },
  { name: 'AWS Certified Cloud Practitioner (CLF-C01)', year: '2023' },
  { name: 'Azure AI Certification', year: '2025' },
  { name: 'National Winner — Smart India Hackathon (Self-Sovereign Identity)', year: '2022' },
]

export const skillGroups = [
  { title: 'Data & Cloud', skills: ['Azure', 'Databricks', 'PySpark', 'SQL', 'Power BI'] },
  { title: 'AI & Agentic Systems', skills: ['LLM Agents', 'Gemini / Claude APIs', 'Prompt & Tool-use Design', 'Compliance AI Guardrails'] },
  { title: 'Finance', skills: ['DCF / SOTP Valuation', 'Basel III Capital Adequacy', 'Bloomberg Terminal', 'Trade Finance Ops'] },
  { title: 'Engineering', skills: ['Python', 'React', 'Flask', 'Hyperledger Fabric'] },
]

export const projects = [
  {
    title: 'Aura — Agentic E-Commerce',
    tag: 'Live product',
    body: 'A full agentic storefront: an LLM shopping agent (search, negotiate, checkout), biometric one-step wallet payments for groceries, and a real-time voice concierge that already knows your order history and preferences.',
    href: '/aura',
    cta: 'Open live site',
    external: false,
  },
  {
    title: 'SlideCraft AI',
    tag: 'Live product',
    body: 'Gemini Pro extracts brand identity and a dense narrative slide plan from raw analysis; Canva Pro’s Connect API (Brand Template search + autofill, OAuth-connected) turns it into an editable deck.',
    href: '/slidecraft',
    cta: 'Open live site',
    external: false,
  },
  {
    title: 'AI Trade Finance Transformation',
    tag: 'Axis Bank',
    body: 'End-to-end AI roadmap for Export Bill processing — Gemini + Cleareye document automation, a Compliance AI Agent with a Maker-Checker confidence matrix, ₹1.2 Cr projected savings.',
    href: profile.linkedin,
    cta: 'View on LinkedIn',
    external: true,
  },
  {
    title: 'Regulatory Data Platform at Scale',
    tag: 'UBS Business Solutions',
    body: '10M+ records/day compliance data pipelines on Azure & Databricks, 80+ FINRA-aligned data-quality controls, USD 3.1M in hard cost savings across 9PB of market data.',
    href: profile.linkedin,
    cta: 'View on LinkedIn',
    external: true,
  },
  {
    title: 'e-Rupee — Hyperledger Fabric',
    tag: 'NPCI',
    body: 'Contributed to the e-Rupee core development team: end-to-end Hyperledger Fabric integration and performance benchmarking against UPI.',
    href: profile.github,
    cta: 'View on GitHub',
    external: true,
  },
  {
    title: 'FABV Valuation Model',
    tag: 'Academic',
    body: 'Built SOTP, DCF and P/E valuation models for an NSE-listed FMCG company; benchmarked 8 peers via business and ratio analysis to issue an investment recommendation.',
    href: profile.github,
    cta: 'View on GitHub',
    external: true,
  },
  {
    title: 'NGO Event Management Platform',
    tag: 'Vishwapandhari',
    body: 'Full-stack event management web application built for an NGO to run and track civic engagement events.',
    href: profile.github,
    cta: 'View on GitHub',
    external: true,
  },
]
