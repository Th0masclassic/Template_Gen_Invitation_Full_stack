import { hashAdminPassword } from "../admin-auth.mjs";

async function readHidden(prompt) {
  if (!process.stdin.isTTY || !process.stdout.isTTY || typeof process.stdin.setRawMode !== "function") {
    throw new Error("Run this command in an interactive terminal or set INVITELAB_NEW_ADMIN_PASSWORD securely.");
  }
  process.stdout.write(prompt);
  process.stdin.setEncoding("utf8");
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolve, reject) => {
    let value = "";
    const finish = (error) => {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === "\u0003") {
          finish(new Error("Password generation cancelled."));
          return;
        }
        if (character === "\r" || character === "\n") {
          finish();
          return;
        }
        if (character === "\u007f" || character === "\b") {
          if (value) {
            value = value.slice(0, -1);
            process.stdout.write("\b \b");
          }
          continue;
        }
        if (character >= " ") {
          value += character;
          process.stdout.write("*");
        }
      }
    };
    process.stdin.on("data", onData);
  });
}

try {
  let password = String(process.env.INVITELAB_NEW_ADMIN_PASSWORD || "");
  if (!password) {
    password = await readHidden("New admin password: ");
    const confirmation = await readHidden("Confirm admin password: ");
    if (password !== confirmation) throw new Error("The passwords do not match.");
  }
  console.log(await hashAdminPassword(password));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
