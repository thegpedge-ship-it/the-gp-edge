"use client";
import ContentPage from '@/app/admin/content/page';
import ApproachesPage from '@/app/admin/approaches/page';
import { useState } from 'react';
import { motion } from 'framer-motion';

const tabs = [
  { name: 'Medical Content', component: ContentPage },
  { name: 'Approaches', component: ApproachesPage }
];

export default function MedicalDirectory() {
  const [active, setActive] = useState(0);
  const ActiveComponent = tabs[active].component;
  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 mb-6">
        {tabs.map((t, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`w-full sm:w-auto px-4 py-2 rounded-md transition ${i === active ? 'bg-teal-800 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
          >
            {t.name}
          </button>
        ))}
      </div>
      <motion.div key={active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        <ActiveComponent />
      </motion.div>
    </div>
  );
}
