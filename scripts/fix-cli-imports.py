"""Fix CLI command imports: replace CLI-utility imports from @nexusts/core with ../core/index.js"""

import re
import os
import glob

# CLI utilities that should come from the CLI's own core module
CLI_UTILS = {
    "Command",
    "CommandContext",
    "logger",
    "flagBool",
    "render",
    "select",
    "colors",
    "parseJsonLoose",
    "nameVariants",
    "writeFile",
}

# Framework exports that should stay as @nexusts/core
FRAMEWORK_EXPORTS = {
    "Application",
    "Module",
    "Controller",
    "Get",
    "Post",
    "Put",
    "Delete",
    "Body",
    "Param",
    "Query",
    "Req",
    "Res",
    "Ctx",
    "Next",
    "User",
    "Inject",
    "Injectable",
    "StaticModule",
}

commands_dir = os.path.join(
    os.path.dirname(__file__), "..", "packages", "cli", "src", "commands"
)
for fpath in sorted(glob.glob(os.path.join(commands_dir, "*.ts"))):
    with open(fpath, "r") as f:
        content = f.read()

    original = content

    # Fix single-line imports: import { X, Y } from "@nexusts/core"
    def fix_line(m):
        line = m.group(0)
        # Extract the imported names
        imports_section = (
            line.split("import")[1].split("from")[0] if "from" in line else ""
        )

        # Check if this import is ONLY CLI utilities (not framework exports)
        all_names = set()
        for part in re.split(r"[,{}]", imports_section):
            name = part.strip()
            if name and not name.startswith("type "):
                all_names.add(name.replace("type ", "").strip())

        # If ALL imported names are CLI utilities, change the path
        if all_names and all_names.issubset(CLI_UTILS):
            return line.replace("@nexusts/core", "../core/index.js")

        # If there's a mix or only framework exports, keep @nexusts/core
        return line

    content = re.sub(
        r'^import\s+.*\bfrom\s+["\']@nexusts/core["\']\s*',
        fix_line,
        content,
        flags=re.MULTILINE,
    )

    # Fix multi-line import closures: } from "@nexusts/core"
    content = re.sub(
        r'^(\s*\}\s*from\s*)["\']@nexusts/core["\']',
        r'\1"../core/index.js"',
        content,
        flags=re.MULTILINE,
    )

    if content != original:
        with open(fpath, "w") as f:
            f.write(content)
        print(f"  Fixed: {os.path.basename(fpath)}")

print("Done")
