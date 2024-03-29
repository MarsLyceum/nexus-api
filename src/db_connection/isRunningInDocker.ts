import { existsSync, readFileSync } from "fs";

export function isRunningInDocker(): boolean {
  try {
    // Check for the .dockerenv file
    if (existsSync("/.dockerenv")) {
      return true;
    }

    // Check for Docker-specific substrings in /proc/1/cgroup
    const cgroupContent = readFileSync("/proc/1/cgroup", "utf8");
    if (
      cgroupContent.includes("docker") ||
      cgroupContent.includes("kubepods")
    ) {
      return true;
    }
  } catch (error) {
    return false;
  }

  return false;
}
