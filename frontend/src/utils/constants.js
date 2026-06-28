export const ROLE_OPTIONS = {
  'Engineering / Tech': [
    'Software Development Engineer (SDE)', 'Frontend Developer', 'Backend Engineer', 'Full Stack Developer',
    'Data Scientist', 'Machine Learning Engineer', 'DevOps Engineer', 'Cloud Architect', 'Cybersecurity Analyst',
    'Mobile App Developer (iOS/Android)', 'QA Automation Engineer', 'Blockchain Developer'
  ],
  'Banking / Finance': [
    'Bank PO (Probationary Officer)', 'Investment Banker', 'Financial Analyst', 'Risk Manager',
    'Wealth Manager', 'Actuary', 'Private Equity Analyst', 'Credit Analyst', 'Chartered Accountant (CA)'
  ],
  'Government / PSU': [
    'UPSC Civil Services (IAS/IPS)', 'SSC CGL', 'PSU Graduate Engineer Trainee (GET)', 'State PSC',
    'Defence Services (NDA/CDS)', 'Railway Recruitment Board (RRB)', 'RBI Grade B Officer'
  ],
  'Management Consulting': [
    'Management Consultant', 'Business Analyst', 'Strategy Associate', 'Operations Consultant',
    'Financial Advisory Consultant', 'Tech Strategy Consultant'
  ],
  'Sales & Marketing': [
    'Sales Executive / BDE', 'Key Account Manager', 'Digital Marketing Manager', 'SEO Specialist',
    'Product Marketing Manager', 'Brand Manager', 'Public Relations (PR) Manager', 'Growth Hacker'
  ],
  'Human Resources': [
    'HR Generalist', 'Talent Acquisition / Recruiter', 'Compensation & Benefits Specialist', 
    'HR Business Partner (HRBP)', 'Learning & Development Manager'
  ],
  'Design & Creative': [
    'UI/UX Designer', 'Product Designer', 'Graphic Designer', 'Art Director',
    'Video Editor / Motion Graphics', 'Content Writer / Copywriter', '3D Animator'
  ],
  'Healthcare & Medical': [
    'Medical Officer / Doctor', 'Registered Nurse', 'Hospital Administrator', 
    'Clinical Research Associate', 'Pharmacist', 'Medical Representative (MR)'
  ],
  'Education & Academia': [
    'Assistant Professor', 'K-12 Teacher', 'Instructional Designer', 'Educational Counselor',
    'Corporate Trainer', 'EdTech Subject Matter Expert (SME)'
  ],
  'Supply Chain & Operations': [
    'Supply Chain Manager', 'Logistics Coordinator', 'Procurement Specialist', 
    'Operations Manager', 'Quality Assurance Manager'
  ],
  'Legal & Compliance': [
    'Corporate Lawyer', 'Litigation Associate', 'Legal Advisor', 'Compliance Officer',
    'Intellectual Property (IP) Lawyer'
  ]
};

export const SPECIFIC_COMPANIES = {
  'Engineering / Tech': ['Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix', 'TCS', 'Infosys', 'Wipro', 'Uber', 'Atlassian', 'Adobe', 'Salesforce', 'Cisco', 'IBM', 'Oracle', 'NVIDIA'],
  'Banking / Finance': ['Goldman Sachs', 'JPMorgan Chase', 'Morgan Stanley', 'HDFC Bank', 'SBI', 'ICICI Bank', 'Axis Bank', 'Citibank', 'Barclays', 'HSBC', 'Standard Chartered', 'Kotak Mahindra'],
  'Government / PSU': ['UPSC (Civil Services)', 'SSC', 'SBI', 'RBI', 'ONGC', 'NTPC', 'ISRO', 'DRDO', 'BHEL', 'GAIL', 'Indian Railways', 'LIC', 'Hindustan Aeronautics (HAL)'],
  'Management Consulting': ['McKinsey & Company', 'Boston Consulting Group (BCG)', 'Bain & Company', 'Deloitte', 'PwC', 'EY', 'KPMG', 'Accenture Strategy', 'Oliver Wyman', 'Roland Berger'],
  'Sales & Marketing': ['Hindustan Unilever (HUL)', 'Procter & Gamble (P&G)', 'ITC Limited', 'Nestle', 'L\'Oreal', 'Coca-Cola', 'PepsiCo', 'Ogilvy', 'HubSpot', 'Salesforce'],
  'Human Resources': ['LinkedIn', 'Workday', 'Randstad', 'Adecco', 'TCS (HR)', 'Reliance Industries (HR)', 'Aditya Birla Group', 'Tata Sons'],
  'Design & Creative': ['IDEO', 'Frog Design', 'Ogilvy', 'Wieden+Kennedy', 'Adobe', 'Figma', 'Canva', 'Pentagram', 'Disney', 'Pixar'],
  'Healthcare & Medical': ['Apollo Hospitals', 'Fortis Healthcare', 'Max Healthcare', 'Sun Pharma', 'Dr. Reddy\'s', 'Cipla', 'Novartis', 'Pfizer', 'Johnson & Johnson'],
  'Education & Academia': ['BYJU\'S', 'Unacademy', 'Physics Wallah', 'Coursera', 'Udemy', 'Delhi University', 'IIT (Faculty)', 'Amity University', 'Teach For India'],
  'Supply Chain & Operations': ['Amazon Logistics', 'FedEx', 'DHL', 'Delhivery', 'Blue Dart', 'Maersk', 'Flipkart Supply Chain', 'Walmart Global Tech'],
  'Legal & Compliance': ['Cyril Amarchand Mangaldas', 'Khaitan & Co', 'Shardul Amarchand Mangaldas', 'Trilegal', 'AZB & Partners', 'Luthra & Luthra', 'Baker McKenzie']
};

export const ALL_ROLES = Object.values(ROLE_OPTIONS).flat().sort();
export const ALL_COMPANIES = Object.values(SPECIFIC_COMPANIES).flat().sort();
