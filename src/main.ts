import * as core from "@actions/core"

export async function run(): Promise<void> {
  try {
    const npmPaths: string = core.getInput("npm-paths")
    const npmPathsList: string[] = npmPaths.split(",")

    const actionPaths: string = core.getInput("action-paths")
    const actionPathsList: string[] = actionPaths.split(",")

    const tfPaths: string = core.getInput("tf-paths")
    const tfPathsList: string[] = tfPaths.split(",")

    console.log(npmPathsList, actionPathsList, tfPathsList)
  } catch (error) {
    console.error(error)
  }
}
