import { parseArgs, type ParseOptions } from "jsr:@std/cli";
import {} from "jsr:@std/semver";
import { log, logStyles, sleep } from "./util.ts";
import * as semver from "jsr:@std/semver";
import { assert, assertStrictEquals } from "jsr:@std/assert";
import { GITUtility } from "jsr:@utility/git";
import { dirname } from "jsr:@std/path";

// parse CLI args
const argConfig = {
  boolean: ["help", "dry-run", "allow-dirty"],
  string: ["version", "next-version"],
  default: { dryRun: false },
  unknown: (raw, key) => {
    if (typeof key === "string") {
      extraFlags.push(key);
    } else {
      extraArgs.push(raw);
    }
    return false;
  },
} as const satisfies ParseOptions;
const extraArgs: string[] = [];
const extraFlags: string[] = [];
const parsedArgs = parseArgs(
  Deno.args,
  argConfig,
);
// safely unpack args
const showHelp: boolean = parsedArgs["help"];
const dryRun: boolean = parsedArgs["dry-run"];
const allowDirty: boolean = parsedArgs["allow-dirty"];
const versionArg: string | undefined = parsedArgs["version"];
const nextVersionArg: string | undefined = parsedArgs["next-version"];

const printUsage = () => {
  const message = [
    "Flags:",
    ...argConfig.boolean.map((f) => `--${f}`),
    "Options:",
    ...argConfig.string.map((f) => `--${f}`),
  ].join("\n");
  log.error(message, logStyles.info);
};

if (showHelp) {
  printUsage();
  Deno.exit();
}

let argError = false;

if (extraArgs.length) {
  const unrecognized = extraArgs
    .map((arg) => arg.toString())
    .map((str) => JSON.stringify(str))
    .join(", ");
  const message = `Unrecognized positional arguments: ${unrecognized}`;
  log.error(message);
  argError = true;
}

if (extraFlags.length) {
  const unrecognized = extraFlags
    .map((arg) => arg.toString())
    .map((str) => JSON.stringify(str))
    .join(", ");
  const message = `Unrecognized flags: ${unrecognized}`;
  log.error(message);
  argError = true;
}

if (argError) {
  printUsage();
  Deno.exit(1);
}

// check cwd
const scriptDir = import.meta.dirname;
assert(scriptDir);
const rootDir = dirname(scriptDir);
const cwd = Deno.cwd();
if (rootDir !== cwd) {
  log.error(
    `Script must be run from repository root: ${JSON.stringify(rootDir)}`,
  );
  Deno.exit(1);
}

// check git
const git = new GITUtility(".");
async function checkUncommittedChanges() {
  const dirty = await git.hasUncommittedChanges();
  const branch = await git.runCommand("branch");
  const wrongBranch = branch !== "main";
  if (dirty || wrongBranch) {
    dirty && log.warn("Git repository has uncommitted changes!");
    wrongBranch && log.warn("Current Git branch is not main!");
    if (!allowDirty) {
      const continueAnyway = confirm("Continue anyway?");
      if (!continueAnyway) {
        Deno.exit(1);
      }
    }
    log.warn("Continuing anyway...");
    await sleep(3);
  }
}
await checkUncommittedChanges();

// get version info
async function getCurrentPackageVersion(): Promise<semver.SemVer> {
  const text = await Deno.readTextFile("deno.json");
  const json: unknown = JSON.parse(text);
  assert(
    json && typeof json === "object" && "version" in json &&
      typeof json["version"] === "string",
  );
  assert("version" in json && typeof json["version"] === "string");
  return semver.parse(json.version);
}
log.info(
  `Current version: ${semver.format(await getCurrentPackageVersion())}`,
);

const promptForVersion = (
  message: string,
  { arg, default: default_ }: {
    arg?: string;
    default?: semver.SemVer;
  },
): semver.SemVer => {
  if (arg != undefined) {
    try {
      return semver.parse(arg);
    } catch {
      log.error(`Invalid version: ${JSON.stringify(arg)}`);
      Deno.exit(1);
    }
  }
  while (true) {
    const input = prompt(
      message,
      default_ && semver.format(default_),
    )?.trim();
    assert(typeof input === "string", "Not a TTY");
    if (!input) {
      continue;
    }
    try {
      return semver.parse(input);
    } catch {
      log.error("Invalid version");
    }
  }
};

const releaseVersion = promptForVersion(
  "Enter new release version:",
  {
    arg: versionArg,
  },
);
const postReleaseVersion = promptForVersion(
  "Enter post-release version:",
  {
    arg: nextVersionArg,
    default: semver.increment(
      releaseVersion,
      "prerelease",
      releaseVersion.prerelease?.[0]?.toString() ?? "dev",
    ),
  },
);

// update, push, and tag new release version
async function updatePackageVersion(
  version: semver.SemVer,
  { createTag }: { createTag: boolean },
): Promise<void> {
  if (dryRun) {
    log.warn("Dry run: Skipping package version update");
    return;
  }
  log.info(
    `Setting package version to ${JSON.stringify(semver.format(version))}`,
  );
  const text = await Deno.readTextFile("deno.json");
  const json: unknown = JSON.parse(text);
  assert(json && typeof json === "object" && "version" in json);
  json["version"] = semver.format(version);
  const output = JSON.stringify(json, null, 2);
  await Deno.writeTextFile("deno.json", output);
  const formatCommand = new Deno.Command(Deno.execPath(), {
    args: ["fmt", "deno.json"],
  });
  const result = await formatCommand.output();
  assert(result.success);
  assertStrictEquals(
    semver.format(await getCurrentPackageVersion()),
    semver.format(version),
  );
  log.info("Committing and pushing version bump");
  await git.runCommand("add", "deno.json");
  await git.runCommand(
    "commit",
    "-m",
    `chore: bump version to $${semver.format(version)}`,
  );
  await git.runCommand("push");
  if (createTag) {
    const tag = `v${semver.format(version)}`;
    log.info(`Pushing Git tag: ${JSON.stringify(tag)}`);
    await git.runCommand("tag", tag);
    await git.runCommand("push", "origin", "tag", tag);
  }
}
await checkUncommittedChanges();
await updatePackageVersion(releaseVersion, { createTag: true });

// publish to JSR
const publishArgs = [];
if (dryRun) {
  publishArgs.push("--dry-run");
}
if (allowDirty) {
  publishArgs.push("--allow-dirty");
}
const publishCommand = new Deno.Command(Deno.execPath(), {
  args: ["publish", ...publishArgs],
  stdin: "null",
  stdout: "inherit",
  stderr: "inherit",
});
const publishResult = await publishCommand.output();
if (!publishResult.success) {
  const { code } = publishResult;
  log.error(`"deno publish" command failed with error code ${code}`);
  Deno.exit(1);
}
