const fs=require('fs');
const schema=fs.readFileSync('supabase/migrations/202609090004_complete_workflows.sql','utf8').replace(/^begin;\s*|^commit;\s*/gmi,'');
const checks=fs.readFileSync('supabase/checks/workflows.sql','utf8');
fs.writeFileSync('supabase/checks/workflows-rollback.sql',`begin;\n${schema}\n${checks}\nrollback;\n`);
