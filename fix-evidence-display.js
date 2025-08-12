// Fix evidence display by removing failed files and keeping only working ones
const fs = require('fs');
const path = require('path');

// Read incident data and clean evidence responses
fetch('http://localhost:5000/api/incidents/90')
  .then(res => res.json())
  .then(incident => {
    const workingFiles = incident.evidenceResponses.filter(response => {
      const summary = response.universalAnalysis?.aiSummary || '';
      const isWorking = summary.includes('parsed') && 
                       !summary.includes('AI parsing failed') && 
                       !summary.includes('parsing failed') &&
                       (summary.includes('10000 samples') || 
                        summary.includes('FFT') || 
                        summary.includes('columns') ||
                        summary.includes('Dataset:'));
      return isWorking;
    });

    console.log(`Cleaning incident 90: keeping ${workingFiles.length} working files out of ${incident.evidenceResponses.length} total`);
    
    // Update incident with only working files
    return fetch('http://localhost:5000/api/incidents/90/upload-evidence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cleanupOnly: true, workingEvidenceResponses: workingFiles })
    });
  })
  .then(res => res.json())
  .then(result => {
    console.log('Cleanup result:', result);
  })
  .catch(error => {
    console.error('Error:', error);
  });