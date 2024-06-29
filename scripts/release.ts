import { assert, assertStrictEquals } from "jsr:@std/assert";
import { parseArgs, type ParseOptions } from "jsr:@std/cli";
import { dirname } from "jsr:@std/path";
import * as semver from "jsr:@std/semver";
import { GITUtility } from "jsr:@utility/git";
import { log, prompt, type RemoveIndex, sleep } from "./util.ts";

const parseOptions = {
  boolean: ["help", "publish-local", "skip-tag", "allow-dirty"],
  unknown: (arg, key) => {
    if (typeof key === "string") {
      log.error(`Unknown flag: ${JSON.stringify(key)}`);
    } else {
      log.error(`Unknown positional argument: ${JSON.stringify(arg)}`);
    }
    Deno.exit(1);
  },
} as const satisfies ParseOptions;

const allFlags = [
  ...parseOptions.boolean,
].sort();

const args = (() => {
  const all = parseArgs(Deno.args, parseOptions);
  const args: Omit<RemoveIndex<typeof all>, "_"> = all;
  return args;
})();

if (args.help) {
  log.info("Recognized flags:");
  for (const flag of allFlags) {
    log.info(`--${flag}`);
  }
  Deno.exit();
}

const publishLocal = args["publish-local"];
const skipTag = args["skip-tag"];
const allowDirty = args["allow-dirty"];

// check cwd
const scriptDir = import.meta.dirname;
assert(scriptDir);
const rootDir = dirname(scriptDir);
const cwd = Deno.cwd();
assertStrictEquals(
  cwd,
  rootDir,
  `Script must be run from repository root: ${JSON.stringify(rootDir)}`,
);

// check git
const git = new GITUtility();
const dirty = await git.hasUncommittedChanges();
const branch = (await git.runCommand("branch"))
  .replace(/^\* /, "")
  .replace(
    /\n$/,
    "",
  );
const wrongBranch = branch !== "main";
if (dirty || wrongBranch) {
  dirty && log.error("Git repository has uncommitted changes");
  wrongBranch && log.error(`Current Git branch (${branch}) is not main`);
  if (allowDirty) {
    log.warn("Continuing anyway...");
    await sleep(1);
  } else {
    Deno.exit(1);
  }
}

// get version info
async function getCurrentPackageVersionString(): Promise<string | undefined> {
  const text = await Deno.readTextFile("deno.json");
  const json: unknown = JSON.parse(text);
  assert(
    json && typeof json === "object",
    'Invalid "deno.json"',
  );
  try {
    assert("version" in json && typeof json.version === "string");
    semver.parse(json.version);
    return json.version;
  } catch {
    return undefined;
  }
}
const startingVersionString = (await getCurrentPackageVersionString()) ??
  "(unknown)";
log.info(
  `Current version: ${startingVersionString}`,
);

const releaseVersion = semver.parse(
  prompt("Enter new release version:"),
);
const defaultPostReleaseVersion = semver.increment(
  releaseVersion,
  "prerelease",
  releaseVersion.prerelease?.[0]?.toString() ?? "dev",
);
const postReleaseVersion = semver.parse(
  prompt(
    "Enter post-release version:",
    semver.format(defaultPostReleaseVersion),
  )!,
);

const releaseVersionString = semver.format(releaseVersion);
const postReleaseVersionString = semver.format(postReleaseVersion);

log.warn(
  `Publishing ${releaseVersionString}, then bumping to ${postReleaseVersionString}`,
);
if (!confirm("Continue?")) {
  Deno.exit(1);
}

// commit and push release version
async function updateCommitPushNewVersion(
  version: string,
): Promise<void> {
  semver.parse(version); // validate semver
  log.info(`Setting package version to ${version}`);
  const text = await Deno.readTextFile("deno.json");
  // this is really hacky, but it guarantees we won't mess with
  // the formatting of the rest of the file.
  const output = text.replace(
    /("version":\s*)".*?"/,
    `$1${JSON.stringify(version)}`,
  );
  await Deno.writeTextFile("deno.json", output);

  // load the newly written version and make sure it matches
  const newVersion = await getCurrentPackageVersionString();
  assertStrictEquals(
    newVersion,
    version,
    "Package update failed",
  );

  log.info("Committing and pushing version bump");
  await git.runCommand("add", "deno.json");
  await git.runCommand(
    "commit",
    "-m",
    `chore: bump version to ${version}`,
  );
  await git.runCommand("push");
}

if (startingVersionString === releaseVersionString) {
  log.info(
    "Skipping version update since release version matches current version",
  );
} else {
  await updateCommitPushNewVersion(releaseVersionString);
}

if (publishLocal) {
  const publishArgs: string[] = [];
  if (allowDirty) {
    publishArgs.push("--allow-dirty");
  }
  const publishDisplayCommand = ["deno publish", ...publishArgs].join(" ");
  log.info(`Running command: ${publishDisplayCommand}`);
  const publishCommand = new Deno.Command(Deno.execPath(), {
    args: ["publish", ...publishArgs],
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  const publishResult = await publishCommand.output();
  assert(
    publishResult.success,
    `"deno publish" command failed with error code ${publishResult.code}`,
  );
}

// push release tag
if (skipTag) {
  log.info("Skipping Git tag");
} else {
  const tag = `release/${releaseVersionString}`;
  log.info(`Creating and pushing Git tag: ${JSON.stringify(tag)}`);
  await git.runCommand("tag", tag);
  await git.runCommand("push", "origin", "tag", tag);
}

// commit and push post-release version
if (startingVersionString === releaseVersionString) {
  log.info(
    "Skipping version update since post-release version matches release version",
  );
} else {
  await updateCommitPushNewVersion(postReleaseVersionString);
}
