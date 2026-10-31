// PreToolUse guard: production secrets in .env.hostinger.local must never be read into, or edited by, an agent session.
// Exit code 2 blocks the tool call and shows stderr to Claude.
const SECRET_FILE = /(^|[\\/])\.env\.hostinger\.local$/i;
const DUMP_COMMAND = /\b(cat|type|more|less|head|tail|bat|nl|Get-Content|gc|Select-String|sls|grep|rg|findstr|sed|awk|cp|copy|scp|curl)\b[^|;&]*\.env\.hostinger\.local/i;

let raw = "";
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    process.exit(0);
  }
  const input = event.tool_input ?? {};
  const filePath = String(input.file_path ?? input.notebook_path ?? input.path ?? "");
  const command = String(input.command ?? "");

  if (SECRET_FILE.test(filePath) || DUMP_COMMAND.test(command)) {
    process.stderr.write(
      "Blocked: .env.hostinger.local holds production secrets. Use the npm scripts (db:status:prod, db:deploy:prod, db:seed:prod), " +
        "which load it through dotenv-cli, or ask the user to change values in hPanel. Never print its contents.\n",
    );
    process.exit(2);
  }
  process.exit(0);
});
