export interface OrderItem {
  id: string;
  type: 'medication' | 'lab' | 'imaging' | 'procedure' | 'nursing' | 'diet' | 'consult';
  name: string;
  details: string;
  frequency?: string;
  duration?: string;
  priority: 'routine' | 'urgent' | 'stat';
  selected: boolean;
}

export interface OrderSet {
  id: string;
  name: string;
  category: string;
  description: string;
  condition: string;
  orders: OrderItem[];
  lastUpdated: string;
  author: string;
  usageCount: number;
}

export const ORDER_SET_CATEGORIES = [
  { id: 'infectious', name: 'Infectious Disease', icon: 'Bug' },
  { id: 'respiratory', name: 'Respiratory', icon: 'Wind' },
  { id: 'cardiac', name: 'Cardiac', icon: 'Heart' },
  { id: 'gastrointestinal', name: 'Gastrointestinal', icon: 'Salad' },
  { id: 'endocrine', name: 'Endocrine', icon: 'Droplet' },
  { id: 'surgical', name: 'Surgical', icon: 'Scissors' },
  { id: 'obstetric', name: 'Obstetric', icon: 'Baby' },
  { id: 'paediatric', name: 'Paediatric', icon: 'Baby' },
  { id: 'emergency', name: 'Emergency', icon: 'Siren' },
];

export const MOCK_ORDER_SETS: OrderSet[] = [
  {
    id: 'os-1',
    name: 'Malaria - Uncomplicated',
    category: 'infectious',
    description: 'Standard treatment protocol for uncomplicated falciparum malaria',
    condition: 'Malaria (P. falciparum)',
    lastUpdated: '2024-01-15',
    author: 'Dr. Ochieng',
    usageCount: 234,
    orders: [
      { id: 'o1', type: 'lab', name: 'Malaria RDT', details: 'Rapid diagnostic test', priority: 'stat', selected: true },
      { id: 'o2', type: 'lab', name: 'Blood Smear for MPs', details: 'Thick and thin smear', priority: 'urgent', selected: true },
      { id: 'o3', type: 'lab', name: 'Complete Blood Count', details: 'CBC with differential', priority: 'routine', selected: true },
      { id: 'o4', type: 'medication', name: 'Artemether-Lumefantrine', details: '80/480mg', frequency: 'BD x 3 days', duration: '3 days', priority: 'urgent', selected: true },
      { id: 'o5', type: 'medication', name: 'Paracetamol', details: '1g', frequency: 'QID PRN', duration: 'As needed', priority: 'routine', selected: true },
      { id: 'o6', type: 'nursing', name: 'Temperature Monitoring', details: 'Every 4 hours', priority: 'routine', selected: true },
      { id: 'o7', type: 'diet', name: 'Regular Diet', details: 'Encourage oral fluids', priority: 'routine', selected: true },
    ],
  },
  {
    id: 'os-2',
    name: 'Malaria - Severe',
    category: 'infectious',
    description: 'Protocol for severe/complicated malaria requiring IV therapy',
    condition: 'Severe Malaria',
    lastUpdated: '2024-02-20',
    author: 'Dr. Mwangi',
    usageCount: 156,
    orders: [
      { id: 'o1', type: 'lab', name: 'Malaria RDT', details: 'Stat', priority: 'stat', selected: true },
      { id: 'o2', type: 'lab', name: 'Blood Smear', details: 'Thick and thin', priority: 'stat', selected: true },
      { id: 'o3', type: 'lab', name: 'CBC', details: 'With differential', priority: 'stat', selected: true },
      { id: 'o4', type: 'lab', name: 'Renal Function', details: 'BUN, Creatinine', priority: 'stat', selected: true },
      { id: 'o5', type: 'lab', name: 'Blood Glucose', details: 'Random', priority: 'stat', selected: true },
      { id: 'o6', type: 'medication', name: 'IV Artesunate', details: '2.4 mg/kg', frequency: '0, 12, 24h then daily', duration: 'Until oral tolerated', priority: 'stat', selected: true },
      { id: 'o7', type: 'medication', name: 'IV Normal Saline', details: '1L', frequency: 'Over 4 hours', priority: 'urgent', selected: true },
      { id: 'o8', type: 'nursing', name: 'Strict I/O', details: 'Hourly urine output', priority: 'urgent', selected: true },
      { id: 'o9', type: 'nursing', name: 'Neuro Obs', details: 'GCS q2h', priority: 'urgent', selected: true },
    ],
  },
  {
    id: 'os-3',
    name: 'Community-Acquired Pneumonia',
    category: 'respiratory',
    description: 'Standard treatment for CAP in adults',
    condition: 'Pneumonia',
    lastUpdated: '2024-01-10',
    author: 'Dr. Kamau',
    usageCount: 312,
    orders: [
      { id: 'o1', type: 'lab', name: 'CBC', details: 'With differential', priority: 'routine', selected: true },
      { id: 'o2', type: 'lab', name: 'CRP', details: 'C-reactive protein', priority: 'routine', selected: true },
      { id: 'o3', type: 'lab', name: 'Sputum Culture', details: 'If productive cough', priority: 'routine', selected: true },
      { id: 'o4', type: 'imaging', name: 'Chest X-ray', details: 'PA and Lateral', priority: 'urgent', selected: true },
      { id: 'o5', type: 'medication', name: 'Amoxicillin', details: '1g', frequency: 'TDS', duration: '7 days', priority: 'urgent', selected: true },
      { id: 'o6', type: 'medication', name: 'Azithromycin', details: '500mg', frequency: 'OD', duration: '3 days', priority: 'urgent', selected: true },
      { id: 'o7', type: 'nursing', name: 'Oxygen Saturation', details: 'Continuous monitoring', priority: 'urgent', selected: true },
    ],
  },
  {
    id: 'os-4',
    name: 'Acute Coronary Syndrome',
    category: 'cardiac',
    description: 'Initial management of suspected ACS',
    condition: 'ACS/STEMI/NSTEMI',
    lastUpdated: '2024-03-01',
    author: 'Dr. Njeri',
    usageCount: 89,
    orders: [
      { id: 'o1', type: 'lab', name: 'Troponin I', details: 'Serial 0, 3, 6 hours', priority: 'stat', selected: true },
      { id: 'o2', type: 'lab', name: 'CBC', details: 'Baseline', priority: 'stat', selected: true },
      { id: 'o3', type: 'lab', name: 'Renal Function', details: 'Pre-contrast', priority: 'stat', selected: true },
      { id: 'o4', type: 'lab', name: 'Lipid Panel', details: 'Fasting preferred', priority: 'routine', selected: true },
      { id: 'o5', type: 'imaging', name: 'ECG', details: '12-lead, repeat in 15 min', priority: 'stat', selected: true },
      { id: 'o6', type: 'imaging', name: 'Chest X-ray', details: 'Portable if unstable', priority: 'urgent', selected: true },
      { id: 'o7', type: 'medication', name: 'Aspirin', details: '300mg', frequency: 'STAT then 75mg OD', priority: 'stat', selected: true },
      { id: 'o8', type: 'medication', name: 'Clopidogrel', details: '300mg loading', frequency: 'STAT then 75mg OD', priority: 'stat', selected: true },
      { id: 'o9', type: 'medication', name: 'Enoxaparin', details: '1mg/kg', frequency: 'BD', priority: 'stat', selected: true },
      { id: 'o10', type: 'medication', name: 'GTN', details: 'SL 0.4mg', frequency: 'PRN', priority: 'stat', selected: true },
      { id: 'o11', type: 'medication', name: 'Morphine', details: '2-4mg IV', frequency: 'PRN for pain', priority: 'urgent', selected: true },
      { id: 'o12', type: 'nursing', name: 'Continuous ECG Monitoring', details: 'Telemetry', priority: 'stat', selected: true },
      { id: 'o13', type: 'consult', name: 'Cardiology Consult', details: 'Urgent for cath consideration', priority: 'stat', selected: true },
    ],
  },
  {
    id: 'os-5',
    name: 'Diabetic Ketoacidosis',
    category: 'endocrine',
    description: 'DKA management protocol',
    condition: 'DKA',
    lastUpdated: '2024-02-15',
    author: 'Dr. Wanjiku',
    usageCount: 67,
    orders: [
      { id: 'o1', type: 'lab', name: 'Blood Glucose', details: 'Stat and hourly', priority: 'stat', selected: true },
      { id: 'o2', type: 'lab', name: 'ABG/VBG', details: 'Arterial or venous blood gas', priority: 'stat', selected: true },
      { id: 'o3', type: 'lab', name: 'Electrolytes', details: 'Na, K, Cl, HCO3', priority: 'stat', selected: true },
      { id: 'o4', type: 'lab', name: 'Renal Function', details: 'BUN, Creatinine', priority: 'stat', selected: true },
      { id: 'o5', type: 'lab', name: 'Ketones', details: 'Blood or urine', priority: 'stat', selected: true },
      { id: 'o6', type: 'medication', name: 'IV Normal Saline', details: '1L', frequency: 'Over 1 hour, then per protocol', priority: 'stat', selected: true },
      { id: 'o7', type: 'medication', name: 'Insulin Regular', details: '0.1 units/kg/hr', frequency: 'IV infusion', priority: 'stat', selected: true },
      { id: 'o8', type: 'medication', name: 'Potassium Chloride', details: '20-40 mEq', frequency: 'Per liter if K < 5.3', priority: 'urgent', selected: true },
      { id: 'o9', type: 'nursing', name: 'Strict I/O', details: 'Hourly', priority: 'stat', selected: true },
      { id: 'o10', type: 'nursing', name: 'Neuro Checks', details: 'GCS q2h', priority: 'urgent', selected: true },
    ],
  },
  {
    id: 'os-6',
    name: 'Acute Gastroenteritis',
    category: 'gastrointestinal',
    description: 'Management of acute diarrheal illness',
    condition: 'AGE',
    lastUpdated: '2024-01-20',
    author: 'Dr. Otieno',
    usageCount: 198,
    orders: [
      { id: 'o1', type: 'lab', name: 'Electrolytes', details: 'Na, K, Cl', priority: 'urgent', selected: true },
      { id: 'o2', type: 'lab', name: 'Renal Function', details: 'BUN, Creatinine', priority: 'urgent', selected: true },
      { id: 'o3', type: 'lab', name: 'Stool Analysis', details: 'Microscopy, culture if indicated', priority: 'routine', selected: true },
      { id: 'o4', type: 'medication', name: 'ORS', details: 'Oral rehydration salts', frequency: 'As tolerated', priority: 'urgent', selected: true },
      { id: 'o5', type: 'medication', name: 'IV Ringer Lactate', details: '1L', frequency: 'Per dehydration status', priority: 'urgent', selected: true },
      { id: 'o6', type: 'medication', name: 'Zinc Sulphate', details: '20mg', frequency: 'OD x 14 days', duration: '14 days', priority: 'routine', selected: true },
      { id: 'o7', type: 'nursing', name: 'Stool Chart', details: 'Frequency and consistency', priority: 'routine', selected: true },
    ],
  },
  {
    id: 'os-7',
    name: 'Pre-Op Elective Surgery',
    category: 'surgical',
    description: 'Standard pre-operative orders for elective surgery',
    condition: 'Pre-operative',
    lastUpdated: '2024-02-28',
    author: 'Dr. Kipchoge',
    usageCount: 145,
    orders: [
      { id: 'o1', type: 'lab', name: 'CBC', details: 'Complete blood count', priority: 'routine', selected: true },
      { id: 'o2', type: 'lab', name: 'Renal Function', details: 'BUN, Creatinine', priority: 'routine', selected: true },
      { id: 'o3', type: 'lab', name: 'Coagulation Profile', details: 'PT/INR, APTT', priority: 'routine', selected: true },
      { id: 'o4', type: 'lab', name: 'Blood Group', details: 'Group and save', priority: 'routine', selected: true },
      { id: 'o5', type: 'imaging', name: 'Chest X-ray', details: 'If indicated by age/comorbidities', priority: 'routine', selected: false },
      { id: 'o6', type: 'imaging', name: 'ECG', details: 'If > 40 years or cardiac history', priority: 'routine', selected: false },
      { id: 'o7', type: 'medication', name: 'NPO', details: 'Nothing by mouth', frequency: 'From midnight', priority: 'urgent', selected: true },
      { id: 'o8', type: 'medication', name: 'DVT Prophylaxis', details: 'Enoxaparin 40mg SC', frequency: 'OD', priority: 'routine', selected: true },
      { id: 'o9', type: 'consult', name: 'Anaesthesia Consult', details: 'Pre-operative assessment', priority: 'routine', selected: true },
    ],
  },
  {
    id: 'os-8',
    name: 'Normal Vaginal Delivery',
    category: 'obstetric',
    description: 'Standard orders for uncomplicated vaginal delivery',
    condition: 'Labour and Delivery',
    lastUpdated: '2024-03-05',
    author: 'Dr. Akinyi',
    usageCount: 278,
    orders: [
      { id: 'o1', type: 'lab', name: 'CBC', details: 'If not done in last 4 weeks', priority: 'routine', selected: true },
      { id: 'o2', type: 'lab', name: 'Blood Group', details: 'Confirm type', priority: 'routine', selected: true },
      { id: 'o3', type: 'medication', name: 'Oxytocin', details: '10 IU IM', frequency: 'After delivery of baby', priority: 'urgent', selected: true },
      { id: 'o4', type: 'nursing', name: 'Partograph', details: 'Monitor labour progress', priority: 'urgent', selected: true },
      { id: 'o5', type: 'nursing', name: 'FHR Monitoring', details: 'Every 30 min', priority: 'urgent', selected: true },
      { id: 'o6', type: 'nursing', name: 'Vital Signs', details: 'Every 30 min in active labour', priority: 'urgent', selected: true },
      { id: 'o7', type: 'diet', name: 'Clear Fluids', details: 'In early labour', priority: 'routine', selected: true },
    ],
  },
  {
    id: 'os-9',
    name: 'Paediatric Dehydration',
    category: 'paediatric',
    description: 'Management of moderate dehydration in children',
    condition: 'Dehydration',
    lastUpdated: '2024-02-10',
    author: 'Dr. Nyambura',
    usageCount: 167,
    orders: [
      { id: 'o1', type: 'lab', name: 'Electrolytes', details: 'Na, K', priority: 'urgent', selected: true },
      { id: 'o2', type: 'lab', name: 'Blood Glucose', details: 'Random', priority: 'urgent', selected: true },
      { id: 'o3', type: 'medication', name: 'ORS', details: '75ml/kg over 4 hours', frequency: 'Per protocol', priority: 'urgent', selected: true },
      { id: 'o4', type: 'medication', name: 'IV Ringer Lactate', details: '20ml/kg bolus if severe', frequency: 'Stat if indicated', priority: 'stat', selected: false },
      { id: 'o5', type: 'nursing', name: 'Daily Weight', details: 'Morning before feeds', priority: 'routine', selected: true },
      { id: 'o6', type: 'nursing', name: 'I/O Chart', details: 'All intake and output', priority: 'urgent', selected: true },
    ],
  },
  {
    id: 'os-10',
    name: 'Sepsis Bundle',
    category: 'emergency',
    description: '1-hour sepsis bundle for early management',
    condition: 'Sepsis/Septic Shock',
    lastUpdated: '2024-03-10',
    author: 'Dr. Mutua',
    usageCount: 112,
    orders: [
      { id: 'o1', type: 'lab', name: 'Lactate', details: 'Stat and repeat if > 2', priority: 'stat', selected: true },
      { id: 'o2', type: 'lab', name: 'Blood Cultures', details: 'x2 sets before antibiotics', priority: 'stat', selected: true },
      { id: 'o3', type: 'lab', name: 'CBC', details: 'With differential', priority: 'stat', selected: true },
      { id: 'o4', type: 'lab', name: 'Renal/Liver Function', details: 'Complete metabolic panel', priority: 'stat', selected: true },
      { id: 'o5', type: 'lab', name: 'Procalcitonin', details: 'If available', priority: 'stat', selected: true },
      { id: 'o6', type: 'medication', name: 'IV Normal Saline', details: '30ml/kg', frequency: 'Within 3 hours if hypotensive', priority: 'stat', selected: true },
      { id: 'o7', type: 'medication', name: 'Ceftriaxone', details: '2g IV', frequency: 'STAT then OD', priority: 'stat', selected: true },
      { id: 'o8', type: 'medication', name: 'Metronidazole', details: '500mg IV', frequency: 'STAT then TDS', priority: 'stat', selected: false },
      { id: 'o9', type: 'nursing', name: 'Continuous Monitoring', details: 'BP, HR, SpO2, UO', priority: 'stat', selected: true },
      { id: 'o10', type: 'consult', name: 'ICU Consult', details: 'If persistent hypotension', priority: 'stat', selected: true },
    ],
  },
];
