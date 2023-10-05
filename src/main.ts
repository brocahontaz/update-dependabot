import * as core from "@actions/core"
import fs from "fs/promises"
import { glob } from "glob"
import YAML from "yaml"
import path from "path"

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

const findMatchingPaths = async (list: string[]) => {
  const files = await glob(list)

  const paths = [...new Set(files.map((file) => path.dirname(file)))]

  return paths
}

export async function run(): Promise<void> {
  try {
    const dependabotFile = await getDependabotFile()
    const currentDocument = YAML.parseDocument(dependabotFile.toString())
    const state = currentDocument.toJS()

    const npmPaths: string = core.getInput("npm-paths")
    const npmPathsList: string[] = npmPaths.split(",")

    const npmList = await findMatchingPaths(npmPathsList)

    const actionPaths: string = core.getInput("action-paths")
    const actionPathsList: string[] = actionPaths.split(",")

    const actionsList = await findMatchingPaths(actionPathsList)

    const tfPaths: string = core.getInput("tf-paths")
    const tfPathsList: string[] = tfPaths.split(",")

    const tfList = await findMatchingPaths(tfPathsList)

    console.log(npmPathsList, actionPathsList, tfPathsList)

    console.log("CFG?", dependabotFile)
    console.log("DOC?", currentDocument)
    console.log("STATE?", state)

    console.log("NPM?", npmList)
    console.log("ACTIONS?", actionsList)
    console.log("TF?", tfList)
  } catch (error) {
    console.error(error)
  }
}
