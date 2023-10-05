import * as core from "@actions/core"
import fs from "fs/promises"

const getDependabotFile = async () => {
  try {
    const file = await fs.readFile("/.github/dependabot.yml")

    console.log(file)
  } catch (error) {
    console.error(error)
  }
}

export async function run(): Promise<void> {
  try {
    const npmPaths: string = core.getInput("npm-paths")
    const npmPathsList: string[] = npmPaths.split(",")

    const actionPaths: string = core.getInput("action-paths")
    const actionPathsList: string[] = actionPaths.split(",")

    const tfPaths: string = core.getInput("tf-paths")
    const tfPathsList: string[] = tfPaths.split(",")

    console.log(npmPathsList, actionPathsList, tfPathsList)

    await getDependabotFile()
  } catch (error) {
    console.error(error)
  }
}
