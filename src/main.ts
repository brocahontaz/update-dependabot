import * as core from "@actions/core"
import fs from "fs/promises"
import { glob } from "glob"
import YAML from "yaml"

const getDependabotFile = async () => {
  let file

  try {
    file = await fs.readFile("/.github/dependabot.yml")

    return file
  } catch (error) {
    file = `
  version: 2
  updates: []`

    return file
  }
}

const findMatchingfiles = async (list: string[]) => {
  const files = await glob(list)

  return files
}

export async function run(): Promise<void> {
  try {
    const dependabotFile = await getDependabotFile()
    const currentDocument = YAML.parseDocument(dependabotFile.toString())
    const state = currentDocument.toJS()

    const npmPaths: string = core.getInput("npm-paths")
    const npmPathsList: string[] = npmPaths.split(",")

    const npmGlob = findMatchingfiles(npmPathsList)

    const actionPaths: string = core.getInput("action-paths")
    const actionPathsList: string[] = actionPaths.split(",")

    const actionsGlob = findMatchingfiles(actionPathsList)

    const tfPaths: string = core.getInput("tf-paths")
    const tfPathsList: string[] = tfPaths.split(",")

    const tfGlob = findMatchingfiles(tfPathsList)

    console.log(npmPathsList, actionPathsList, tfPathsList)

    console.log("CFG?", dependabotFile)
    console.log("DOC?", currentDocument)
    console.log("STATE?", state)

    console.log("NPM?", npmGlob)
    console.log("ACTIONS?", actionsGlob)
    console.log("TF?", tfGlob)
  } catch (error) {
    console.error(error)
  }
}
