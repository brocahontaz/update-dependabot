import * as core from "@actions/core"
import fs from "fs/promises"

const getDependabotFile = async () => {
  let file

  try {
    file = await fs.readFile("/.github/dependabot.yml")

    return file
  } catch (error) {
    file = `
  version: 2
  updates:[]`

    return file
  }
}

export async function run(): Promise<void> {
  try {
    const dependabotFile = await getDependabotFile()

    const npmPaths: string = core.getInput("npm-paths")
    const npmPathsList: string[] = npmPaths.split(",")

    const actionPaths: string = core.getInput("action-paths")
    const actionPathsList: string[] = actionPaths.split(",")

    const tfPaths: string = core.getInput("tf-paths")
    const tfPathsList: string[] = tfPaths.split(",")

    console.log(npmPathsList, actionPathsList, tfPathsList)

    console.log("CFG", dependabotFile)
  } catch (error) {
    console.error(error)
  }
}
