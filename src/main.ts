import * as core from "@actions/core"

export async function run(): Promise<void> {
  try {
    const paths: string = core.getInput("paths")

    const pathsList: string[] = paths.split(",")

    console.log(pathsList)
  } catch (error) {
    console.error(error)
  }
}
