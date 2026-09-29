const { copyFile, mkdir, rm } = require("node:fs/promises");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const outputDirectory = path.join(projectRoot, "dist");
const publishedFiles = ["index.html", "app.js", "styles.css"];

async function build() {
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });

  for (const fileName of publishedFiles) {
    await copyFile(
      path.join(projectRoot, fileName),
      path.join(outputDirectory, fileName),
    );
  }
}

build().catch((error) => {
  console.error("Static site build failed:", error);
  process.exitCode = 1;
});
