// Run this in browser console on /incident-reporting page
console.log('=== MANUFACTURER & MODEL FIELD VERIFICATION ===');

// Wait for page to load
setTimeout(() => {
  const allInputs = [...document.querySelectorAll('input,textarea')];
  console.log(`Total inputs found: ${allInputs.length}`);
  
  const manufacturerFields = allInputs.filter(el => 
    /manufacturer/i.test(el.name || el.placeholder || el.getAttribute('data-testid') || '')
  );
  
  const modelFields = allInputs.filter(el => 
    /model/i.test(el.name || el.placeholder || el.getAttribute('data-testid') || '')
  );
  
  console.log('Manufacturer fields:', manufacturerFields.map(el => ({
    name: el.name,
    placeholder: el.placeholder,
    testId: el.getAttribute('data-testid'),
    visible: el.offsetWidth > 0 && el.offsetHeight > 0,
    position: el.getBoundingClientRect()
  })));
  
  console.log('Model fields:', modelFields.map(el => ({
    name: el.name, 
    placeholder: el.placeholder,
    testId: el.getAttribute('data-testid'),
    visible: el.offsetWidth > 0 && el.offsetHeight > 0,
    position: el.getBoundingClientRect()
  })));
  
  if (manufacturerFields.length > 0 && modelFields.length > 0) {
    console.log('✅ SUCCESS: Manufacturer and Model fields found!');
    
    // Test field functionality
    if (manufacturerFields[0] && modelFields[0]) {
      manufacturerFields[0].value = 'Test Manufacturer';
      modelFields[0].value = 'Test Model';
      manufacturerFields[0].dispatchEvent(new Event('input', { bubbles: true }));
      modelFields[0].dispatchEvent(new Event('input', { bubbles: true }));
      console.log('✅ Fields can be typed in successfully');
    }
  } else {
    console.log('❌ MISSING: Manufacturer or Model fields not found');
  }
}, 1000);
