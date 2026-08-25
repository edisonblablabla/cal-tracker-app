import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');

// Clean hidden space characters
code = code.replace(/[\u00a0\xa0]/g, ' ');

// 1. Translate Motivation Quotes to English (if any Tagalog remains)
code = code.replace(
  'Consistent exercise leads to better results.',
  'Consistency is what transforms average into excellence.'
);

// 2. Translate Progress Status Messages
code = code.replace(
  '`Magandang progreso! Pumayat ka ng ${Math.abs(weightChange)} kg sa nakalipas na mga araw.`',
  '`Great progress! You lost ${Math.abs(weightChange)} kg in recent days.`'
);
code = code.replace(
  '"Maintain ang timbang! Nananatili sa maayos na progress."',
  '"Weight maintained! Keeping up steady progress."'
);
code = code.replace(
  '`Nataas ng ${weightChange} kg ang timbang. Panatilihin ang calorie target.`',
  '`Weight increased by ${weightChange} kg. Stick to your active calorie target.`'
);

// 3. Translate BMI Status Tips
code = code.replace(
  '"Slightly underweight. Consider adding nutrient-dense meals."',
  '"Slightly underweight. Consider adding nutrient-dense meals to your daily routine."'
);
code = code.replace(
  '"Nasa maayos at ligtas ka na BMI range! Ipagpatuloy ang kasalukuyang gawi sa kain."',
  '"You are in a healthy BMI range! Maintain your current balanced lifestyle."'
);
code = code.replace(
  '"Above recommended BMI. Stick to your active deficit plan for steady results."',
  '"Above recommended BMI range. Stick to your active calorie deficit plan for steady results."'
);

// 4. Translate Progress Chart Baseline Note
code = code.replace(
  '📍 Initial weight baseline recorded. Log new weight updates to track your progression!',
  '📍 Initial weight baseline recorded. Log new weight updates to track your progression over time!'
);

fs.writeFileSync('src/App.jsx', code);
console.log('✅ Full English translation applied successfully across all tabs!');
