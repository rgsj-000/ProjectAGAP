const fs = require('fs');
const files = ['202609090001_initial_agap.sql','202609090002_operational_actions.sql','202609090003_operational_write_policies.sql'];
const schema = files.map(f => fs.readFileSync('supabase/migrations/'+f,'utf8').replace(/^begin;\s*|^commit;\s*/gmi,'')).join('\n');
const tests = fs.readFileSync('supabase/checks/operational-policies.sql','utf8');
fs.writeFileSync('supabase/checks/reconcile-rollback.sql','begin;\n'+schema+'\n'+tests+'\nrollback;\n');
fs.writeFileSync('supabase/checks/policies-rollback.sql','begin;\n'+tests+'\nrollback;\n');
