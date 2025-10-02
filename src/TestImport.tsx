import React from 'react';
import { ALL_STATES } from '@/data/legalDatasets';

const TestImport: React.FC = () => {
  return (
    <div>
      <h1>Test Import</h1>
      <p>States count: {ALL_STATES.length}</p>
    </div>
  );
};

export default TestImport;