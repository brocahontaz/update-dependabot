import * as core from "@actions/core"
import fs from "fs/promises"
import { glob } from "glob"
import YAML from "yaml"
import path from "path"

const DEPENDABOT_FILE = "./.github/dependabot.yml"

const getDependabotFile = async () => {
  let file

  try {
    file = await fs.readFile(DEPENDABOT_FILE)

    return file
  } catch (error) {
    file = `
  version: 2
  updates: []
  registries: {}`

    return file
  }
}

const extractPaths = async (list: string[]) => {
  const files = await glob(list)
  const paths = [...new Set(files.map((file) => path.dirname(file)))]

  return paths
}

const getPaths = async (type: string) => {
  const input: string = core.getInput(type)

  if (input != "") {
    const inputList: string[] = input.split(",")
    const paths = await extractPaths(inputList)
    return paths
  }

  return []
}

const buildConfigs = async (
  paths: string[],
  ecosystem: string,
  registries: string,
  schedule: string,
) => {
  const configs = paths.map((path) => ({
    "package-ecosystem": `${ecosystem}`,
    directory: `${path != "." ? path : ""}/`,
    ...(registries != "" && { registries }),
    schedule: { interval: `${schedule}` },
  }))

  configs.sort()

  return configs
}

const parseRegistries = async (registries: string) => {
  const registriesYAML = registries != "" ? YAML.parse(registries) : "{}"

  return registriesYAML
}

export async function run(): Promise<void> {
  try {
    const dependabotFile = await getDependabotFile()
    const currentDocument = YAML.parseDocument(dependabotFile.toString())
    const state = currentDocument.toJS()

    const npmPaths: string[] = await getPaths("npm-paths")
    const actionPaths: string[] = await getPaths("action-paths")
    const tfPaths: string[] = await getPaths("tf-paths")

    const registries = core.getInput("registries")
    const registriesConfig = await parseRegistries(registries)

    const npmConfigs = await buildConfigs(
      npmPaths,
      "npm",
      "",
      core.getInput("npm-schedule"),
    )

    const actionConfigs = await buildConfigs(
      actionPaths,
      "github-actions",
      "",
      core.getInput("action-schedule"),
    )

    const tfConfigs = await buildConfigs(
      tfPaths,
      "terraform",
      core.getInput("tf-registries"),
      core.getInput("tf-schedule"),
    )

    const allConfigs = [...npmConfigs, ...actionConfigs, ...tfConfigs]

    state.updates = allConfigs
    state.registries = registriesConfig

    const newDocument = new YAML.Document(state)
    await fs.writeFile(DEPENDABOT_FILE, String(newDocument))
  } catch (error) {
    console.error(error)
  }
}
